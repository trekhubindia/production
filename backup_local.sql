

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."auth_user" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255),
    "phone" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "trek_slug" character varying(255) NOT NULL,
    "slot_id" "uuid",
    "booking_date" "date",
    "participants" integer DEFAULT 1,
    "customer_name" character varying(255) NOT NULL,
    "customer_email" character varying(255) NOT NULL,
    "customer_phone" character varying(20),
    "customer_age" integer,
    "customer_gender" character varying(50),
    "medical_conditions" "text",
    "trekking_experience" character varying(50),
    "fitness_consent" boolean DEFAULT false,
    "residential_address" "text",
    "terms_accepted" boolean DEFAULT false,
    "liability_waiver_accepted" boolean DEFAULT false,
    "covid_declaration_accepted" boolean DEFAULT false,
    "base_amount" numeric(10,2),
    "gst_amount" numeric(10,2),
    "total_amount" numeric(10,2),
    "status" character varying(50) DEFAULT 'pending_approval'::character varying,
    "payment_status" character varying(50) DEFAULT 'not_required'::character varying,
    "special_requirements" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trek_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trek_id" "uuid",
    "date" "date" NOT NULL,
    "capacity" integer DEFAULT 20,
    "booked" integer DEFAULT 0,
    "available" integer GENERATED ALWAYS AS (("capacity" - "booked")) STORED,
    "price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trek_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "region" character varying(100),
    "difficulty" character varying(50),
    "duration" character varying(50),
    "price" numeric(10,2),
    "image" "text",
    "rating" numeric(3,2),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" character varying(255),
    "username" character varying(100),
    "phone" character varying(20),
    "date_of_birth" "date",
    "gender" character varying(50),
    "bio" "text",
    "location" character varying(255),
    "website" character varying(255),
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_session" (
    "id" character varying(128) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_session" OWNER TO "postgres";


ALTER TABLE ONLY "public"."auth_user"
    ADD CONSTRAINT "auth_user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."auth_user"
    ADD CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trek_slots"
    ADD CONSTRAINT "trek_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treks"
    ADD CONSTRAINT "treks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treks"
    ADD CONSTRAINT "treks_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_session"
    ADD CONSTRAINT "user_session_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_trek_slug" ON "public"."bookings" USING "btree" ("trek_slug");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_trek_slots_date" ON "public"."trek_slots" USING "btree" ("date");



CREATE INDEX "idx_trek_slots_trek_id" ON "public"."trek_slots" USING "btree" ("trek_id");



CREATE INDEX "idx_treks_featured" ON "public"."treks" USING "btree" ("featured");



CREATE INDEX "idx_treks_slug" ON "public"."treks" USING "btree" ("slug");



CREATE INDEX "idx_treks_status" ON "public"."treks" USING "btree" ("status");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_session_user_id" ON "public"."user_session" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."trek_slots"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trek_slots"
    ADD CONSTRAINT "trek_slots_trek_id_fkey" FOREIGN KEY ("trek_id") REFERENCES "public"."treks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_session"
    ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."auth_user" TO "anon";
GRANT ALL ON TABLE "public"."auth_user" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_user" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."trek_slots" TO "anon";
GRANT ALL ON TABLE "public"."trek_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."trek_slots" TO "service_role";



GRANT ALL ON TABLE "public"."treks" TO "anon";
GRANT ALL ON TABLE "public"."treks" TO "authenticated";
GRANT ALL ON TABLE "public"."treks" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_session" TO "anon";
GRANT ALL ON TABLE "public"."user_session" TO "authenticated";
GRANT ALL ON TABLE "public"."user_session" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
