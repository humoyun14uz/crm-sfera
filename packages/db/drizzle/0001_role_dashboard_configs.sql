CREATE TABLE IF NOT EXISTS "role_dashboard_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "academy_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "dashboard_key" varchar(50) NOT NULL,
  "title" varchar(150) NOT NULL,
  "description" text,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "role_dashboard_configs_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE cascade,
  CONSTRAINT "role_dashboard_configs_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "role_dashboard_config_unique" ON "role_dashboard_configs" ("academy_id", "role_id", "dashboard_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_dashboard_configs_academy_idx" ON "role_dashboard_configs" ("academy_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboard_widgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "dashboard_config_id" uuid NOT NULL,
  "widget_key" varchar(80) NOT NULL,
  "widget_type" varchar(50) NOT NULL,
  "label" varchar(150) NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "dashboard_widgets_dashboard_config_id_role_dashboard_configs_id_fk" FOREIGN KEY ("dashboard_config_id") REFERENCES "role_dashboard_configs"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_widget_unique" ON "dashboard_widgets" ("dashboard_config_id", "widget_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_widgets_config_idx" ON "dashboard_widgets" ("dashboard_config_id");
