CREATE INDEX "groups_course_status_idx" ON "groups" USING btree ("course_id","status");--> statement-breakpoint
CREATE INDEX "groups_academy_created_idx" ON "groups" USING btree ("academy_id","created_at");--> statement-breakpoint
CREATE INDEX "invoices_academy_created_idx" ON "invoices" USING btree ("academy_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_academy_created_idx" ON "audit_logs" USING btree ("academy_id","created_at");