CREATE TABLE "dashboard_widgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_config_id" uuid NOT NULL,
	"widget_key" varchar(80) NOT NULL,
	"widget_type" varchar(50) NOT NULL,
	"label" varchar(150) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_dashboard_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"dashboard_key" varchar(50) NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_config_id_role_dashboard_configs_id_fk" FOREIGN KEY ("dashboard_config_id") REFERENCES "public"."role_dashboard_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_dashboard_configs" ADD CONSTRAINT "role_dashboard_configs_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."academies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_dashboard_configs" ADD CONSTRAINT "role_dashboard_configs_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_widget_unique" ON "dashboard_widgets" USING btree ("dashboard_config_id","widget_key");--> statement-breakpoint
CREATE INDEX "dashboard_widgets_config_idx" ON "dashboard_widgets" USING btree ("dashboard_config_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_dashboard_config_unique" ON "role_dashboard_configs" USING btree ("academy_id","role_id","dashboard_key");--> statement-breakpoint
CREATE INDEX "role_dashboard_configs_academy_idx" ON "role_dashboard_configs" USING btree ("academy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grades_group_student_assignment_unique" ON "grades" USING btree ("group_id","student_id","assignment_id");