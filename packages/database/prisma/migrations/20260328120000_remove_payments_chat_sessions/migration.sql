-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_course_id_fkey";
ALTER TABLE "telegram_sessions" DROP CONSTRAINT IF EXISTS "telegram_sessions_tg_account_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "payments";
DROP TABLE IF EXISTS "chat_messages";
DROP TABLE IF EXISTS "telegram_sessions";

-- DropEnum
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "PaymentProvider";
DROP TYPE IF EXISTS "ChatMessageRole";
