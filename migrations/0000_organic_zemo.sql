CREATE TABLE "activity_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"module_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "collaboration_messages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"sender" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"requires_response" boolean NOT NULL,
	"priority" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consciousness_modules" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"integration_level" real NOT NULL,
	"load" real NOT NULL,
	"metrics" json NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_memory" (
	"id" varchar PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "cost_tracking" (
	"id" varchar PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"service" varchar(100) NOT NULL,
	"endpoint" varchar(255),
	"model" varchar(100),
	"tokens" integer,
	"cost" real NOT NULL,
	"request_type" varchar(100) NOT NULL,
	"details" json
);
--> statement-breakpoint
CREATE TABLE "emergency_actions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_nodes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"position" json NOT NULL,
	"connections" json NOT NULL,
	"weight" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_status" (
	"id" varchar PRIMARY KEY NOT NULL,
	"ethical_compliance" real NOT NULL,
	"value_alignment" real NOT NULL,
	"safety_constraints" boolean NOT NULL,
	"quarantine_queue_size" integer NOT NULL,
	"last_alert" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" varchar PRIMARY KEY NOT NULL,
	"consciousness_coherence" real NOT NULL,
	"creative_intelligence" real NOT NULL,
	"safety_compliance" real NOT NULL,
	"learning_efficiency" real NOT NULL,
	"cost_per_hour" real NOT NULL,
	"modules_online" integer NOT NULL,
	"total_modules" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporal_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"confidence" real NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"predicted_for" timestamp,
	"actual_outcome" text,
	"module_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" varchar,
	"email" varchar,
	"name" varchar,
	"picture" varchar,
	"username" varchar,
	"role" varchar(50) DEFAULT 'admin',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "activity_events_timestamp_idx" ON "activity_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "activity_events_module_id_idx" ON "activity_events" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "activity_events_type_idx" ON "activity_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "collaboration_messages_timestamp_idx" ON "collaboration_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "collaboration_messages_priority_idx" ON "collaboration_messages" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "consciousness_modules_status_idx" ON "consciousness_modules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consciousness_modules_last_updated_idx" ON "consciousness_modules" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "conversation_memory_session_id_idx" ON "conversation_memory" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "conversation_memory_timestamp_idx" ON "conversation_memory" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "cost_tracking_timestamp_idx" ON "cost_tracking" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "cost_tracking_service_idx" ON "cost_tracking" USING btree ("service");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics" USING btree ("timestamp");