import { Inject, Injectable, Logger } from '@nestjs/common'
import { WebSocket } from 'ws'
import { notifications, createDb } from '@sfera/db'
import { desc, eq, and } from 'drizzle-orm'
import { NotificationSocketIdentity } from './notifications-socket-auth.service'

export type RealtimeNotification = {
  id: string
  title: string
  category: string
  read: boolean
  createdAt: string
  target: string
}

@Injectable()
export class NotificationsRealtimeService {
  private readonly logger = new Logger(NotificationsRealtimeService.name)
  private readonly clients = new Map<WebSocket, NotificationSocketIdentity>()
  /** Per-socket room subscriptions; every socket starts in its user/academy/role rooms. */
  private readonly subscriptions = new Map<WebSocket, Set<string>>()

  constructor(@Inject('DATABASE') private readonly db: ReturnType<typeof createDb>) {}

  /**
   * Deterministic, tenant-safe room names. The role room is academy scoped so a
   * `Manager` of academy A can never collide with a `Manager` of academy B.
   */
  static room(identity: Pick<NotificationSocketIdentity, 'userId' | 'academyId' | 'role'>): string[] {
    return [
      `user:${identity.userId}`,
      `academy:${identity.academyId}`,
      `academy:${identity.academyId}:role:${identity.role}`,
    ]
  }

  register(client: WebSocket, identity: NotificationSocketIdentity) {
    this.clients.set(client, identity)
    this.subscriptions.set(client, new Set(NotificationsRealtimeService.room(identity)))
  }

  unregister(client: WebSocket) {
    this.clients.delete(client)
    this.subscriptions.delete(client)
  }

  /** Add/remove an additional room (e.g. `group:${groupId}`) for this socket. */
  subscribe(client: WebSocket, rooms: string[]) {
    for (const room of rooms) this.subscriptions.get(client)?.add(room)
  }

  unsubscribe(client: WebSocket, rooms: string[]) {
    const current = this.subscriptions.get(client)
    if (!current) return
    for (const room of rooms) current.delete(room)
  }

  isSubscribed(client: WebSocket, room: string): boolean {
    return this.subscriptions.get(client)?.has(room) ?? false
  }

  async snapshot(identity: NotificationSocketIdentity) {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, identity.userId),
          eq(notifications.academyId, identity.academyId)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20)

    return rows.map((row) => this.toPayload(row))
  }

  /** Push to every socket that is subscribed to any of the target rooms. */
  publishToRooms(rooms: string[], payload: unknown) {
    const serialized = JSON.stringify(payload)
    for (const client of this.clients.keys()) {
      if (client.readyState !== 1) continue
      const subscribed = this.subscriptions.get(client)
      if (!subscribed) continue
      const deliverable = rooms.some((room) => subscribed.has(room))
      if (deliverable) client.send(serialized)
    }
  }

  /** Convenience: fan-out to a single user's room (user + academy scope). */
  publish(notification: RealtimeNotification, identity: NotificationSocketIdentity) {
    this.publishToRooms(
      [`user:${identity.userId}`, `academy:${identity.academyId}`],
      { type: 'notification', notification }
    )
  }

  /** Convenience: fan-out to every member of a role inside one academy. */
  publishToRole(academyId: string, role: string, payload: unknown) {
    this.publishToRooms([`academy:${academyId}:role:${role}`], payload)
  }

  private toPayload(row: typeof notifications.$inferSelect): RealtimeNotification {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      read: row.isRead,
      createdAt: row.createdAt.toISOString(),
      target: row.targetPath ?? '/settings/notifications',
    }
  }
}
