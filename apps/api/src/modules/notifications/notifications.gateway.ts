import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Inject, Logger } from '@nestjs/common'
import { Server, WebSocket } from 'ws'
import { NotificationsRealtimeService } from './notifications-realtime.service'
import { NotificationsSocketAuth } from './notifications-socket-auth.service'

const AUTH_TIMEOUT_MS = 10_000

type AuthMessage = { token?: string }
type RoomMessage = { rooms?: string[] }
type NotificationSocketIdentity = { userId: string; academyId: string; role: string }

@WebSocketGateway({ path: '/notifications' })
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name)
  private readonly identities = new WeakMap<WebSocket, NotificationSocketIdentity>()
  private readonly authTimers = new WeakMap<WebSocket, NodeJS.Timeout>()

  @WebSocketServer()
  server!: Server

  constructor(
    @Inject(NotificationsRealtimeService)
    private readonly realtime: NotificationsRealtimeService,
    @Inject(NotificationsSocketAuth)
    private readonly socketAuth: NotificationsSocketAuth
  ) {}

  handleConnection(client: WebSocket) {
    // Every connection starts unauthenticated and must send `{ type: 'auth',
    // token }` within AUTH_TIMEOUT_MS or it is closed with 1008.
    this.authTimers.set(
      client,
      setTimeout(() => client.close(1008, 'Authentication timeout'), AUTH_TIMEOUT_MS)
    )
  }

  handleDisconnect(client: WebSocket) {
    const timer = this.authTimers.get(client)
    if (timer) clearTimeout(timer)
    this.authTimers.delete(client)
    this.identities.delete(client)
    this.realtime.unregister(client)
  }

  @SubscribeMessage('auth')
  async authenticate(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: AuthMessage
  ) {
    try {
      const identity = await this.socketAuth.authenticate(message?.token ?? '')
      const timer = this.authTimers.get(client)
      if (timer) clearTimeout(timer)
      this.authTimers.delete(client)
      this.identities.set(client, identity)
      this.realtime.register(client, identity)

      const snapshot = await this.realtime.snapshot(identity)
      // Rooms are deterministic: `user:{id}`, `academy:{id}` and
      // `academy:{id}:role:{role}` are joined automatically.
      client.send(JSON.stringify({ type: 'notification.snapshot', notifications: snapshot }))
      return {
        type: 'auth.ok',
        userId: identity.userId,
        role: identity.role,
        rooms: NotificationsRealtimeService.room(identity),
      }
    } catch (error) {
      this.logger.warn(`WebSocket authentication failed: ${String(error)}`)
      client.close(1008, 'Unauthorized')
      return { type: 'auth.error', message: 'Unauthorized' }
    }
  }

  /** Join additional rooms (e.g. `group:${groupId}` for group chat badges). */
  @SubscribeMessage('subscribe')
  subscribe(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: RoomMessage
  ) {
    const identity = this.identities.get(client)
    if (!identity) {
      client.close(1008, 'Authenticate first')
      return { type: 'subscribe.error', message: 'Authenticate first' }
    }

    const rooms = (message?.rooms ?? [])
      .map((room) => String(room).trim())
      .filter(Boolean)
      // Tenant safety: a socket may only join rooms that embed its own user id
      // or academy id (e.g. `group:{id}` inside the same academy is permitted).
      .filter((room) => room.includes(identity.academyId) || room.includes(identity.userId))

    this.realtime.subscribe(client, rooms)
    return { type: 'subscribe.ok', rooms }
  }

  @SubscribeMessage('unsubscribe')
  unsubscribe(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() message: RoomMessage
  ) {
    const identity = this.identities.get(client)
    if (!identity) {
      client.close(1008, 'Authenticate first')
      return { type: 'unsubscribe.error', message: 'Authenticate first' }
    }

    const rooms = (message?.rooms ?? []).map((room) => String(room).trim()).filter(Boolean)
    this.realtime.unsubscribe(client, rooms)
    return { type: 'unsubscribe.ok', rooms }
  }
}
