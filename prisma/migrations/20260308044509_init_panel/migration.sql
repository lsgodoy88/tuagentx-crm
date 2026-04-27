-- CreateEnum
CREATE TYPE "DeviceMessage" AS ENUM ('ios', 'android', 'web', 'unknown', 'desktop');

-- CreateEnum
CREATE TYPE "DifyBotType" AS ENUM ('chatBot', 'textGenerator', 'agent', 'workflow');

-- CreateEnum
CREATE TYPE "InstanceConnectionStatus" AS ENUM ('open', 'close', 'connecting');

-- CreateEnum
CREATE TYPE "OpenaiBotType" AS ENUM ('assistant', 'chatCompletion');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('opened', 'closed', 'paused');

-- CreateEnum
CREATE TYPE "TriggerOperator" AS ENUM ('contains', 'equals', 'startsWith', 'endsWith', 'regex');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('all', 'keyword', 'none', 'advanced');

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "labels" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "instanceId" TEXT NOT NULL,
    "name" VARCHAR(100),
    "unreadMessages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chatwoot" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "accountId" VARCHAR(100),
    "token" VARCHAR(100),
    "url" VARCHAR(500),
    "nameInbox" VARCHAR(100),
    "signMsg" BOOLEAN DEFAULT false,
    "signDelimiter" VARCHAR(100),
    "number" VARCHAR(100),
    "reopenConversation" BOOLEAN DEFAULT false,
    "conversationPending" BOOLEAN DEFAULT false,
    "mergeBrazilContacts" BOOLEAN DEFAULT false,
    "importContacts" BOOLEAN DEFAULT false,
    "importMessages" BOOLEAN DEFAULT false,
    "daysLimitImportMessages" INTEGER,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "logo" VARCHAR(500),
    "organization" VARCHAR(100),
    "ignoreJids" JSONB,

    CONSTRAINT "Chatwoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "pushName" VARCHAR(100),
    "profilePicUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dify" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "botType" "DifyBotType" NOT NULL,
    "apiUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "description" VARCHAR(255),
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "Dify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifySetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "difyIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "DifySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evoai" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "agentUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Evoai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvoaiSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "evoaiIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "EvoaiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionBot" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "apiUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "EvolutionBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionBotSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "botIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "EvolutionBotSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flowise" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "apiUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "Flowise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowiseSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "flowiseIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "FlowiseSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instance" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "connectionStatus" "InstanceConnectionStatus" NOT NULL DEFAULT 'open',
    "ownerJid" VARCHAR(100),
    "profilePicUrl" VARCHAR(500),
    "integration" VARCHAR(100),
    "number" VARCHAR(100),
    "token" VARCHAR(255),
    "clientName" VARCHAR(100),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "profileName" VARCHAR(100),
    "businessId" VARCHAR(100),
    "disconnectionAt" TIMESTAMP(6),
    "disconnectionObject" JSONB,
    "disconnectionReasonCode" INTEGER,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSession" (
    "id" TEXT NOT NULL,
    "sessionId" VARCHAR(255) NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "pushName" TEXT,
    "status" "SessionStatus" NOT NULL,
    "awaitUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "parameters" JSONB,
    "context" JSONB,
    "botId" TEXT,
    "type" VARCHAR(100),

    CONSTRAINT "IntegrationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsOnWhatsapp" (
    "id" TEXT NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "jidOptions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "lid" VARCHAR(100),

    CONSTRAINT "IsOnWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kafka" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Kafka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "labelId" VARCHAR(100),
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(100) NOT NULL,
    "predefinedId" VARCHAR(100),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "createdAt" DATE DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "key" JSONB NOT NULL,
    "pushName" VARCHAR(100),
    "participant" VARCHAR(100),
    "messageType" VARCHAR(100) NOT NULL,
    "message" JSONB NOT NULL,
    "contextInfo" JSONB,
    "source" "DeviceMessage" NOT NULL,
    "messageTimestamp" INTEGER NOT NULL,
    "chatwootMessageId" INTEGER,
    "chatwootInboxId" INTEGER,
    "chatwootConversationId" INTEGER,
    "chatwootContactInboxSourceId" VARCHAR(100),
    "chatwootIsRead" BOOLEAN,
    "instanceId" TEXT NOT NULL,
    "webhookUrl" VARCHAR(500),
    "sessionId" TEXT,
    "status" VARCHAR(30),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageUpdate" (
    "id" TEXT NOT NULL,
    "keyId" VARCHAR(100) NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "participant" VARCHAR(100),
    "pollUpdates" JSONB,
    "status" VARCHAR(30) NOT NULL,
    "messageId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "MessageUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "N8n" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "webhookUrl" VARCHAR(255),
    "basicAuthUser" VARCHAR(255),
    "basicAuthPass" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "N8n_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "N8nSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "n8nIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "N8nSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nats" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Nats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenaiBot" (
    "id" TEXT NOT NULL,
    "assistantId" VARCHAR(255),
    "model" VARCHAR(100),
    "systemMessages" JSONB,
    "assistantMessages" JSONB,
    "userMessages" JSONB,
    "maxTokens" INTEGER,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "openaiCredsId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "botType" "OpenaiBotType" NOT NULL,
    "description" VARCHAR(255),
    "functionUrl" VARCHAR(500),
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "OpenaiBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenaiCreds" (
    "id" TEXT NOT NULL,
    "apiKey" VARCHAR(255),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "OpenaiCreds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenaiSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "openaiCredsId" TEXT NOT NULL,
    "openaiIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "speechToText" BOOLEAN DEFAULT false,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "OpenaiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "host" VARCHAR(100) NOT NULL,
    "port" VARCHAR(100) NOT NULL,
    "protocol" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pusher" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "appId" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "secret" VARCHAR(100) NOT NULL,
    "cluster" VARCHAR(100) NOT NULL,
    "useTLS" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Pusher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rabbitmq" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Rabbitmq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "creds" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "rejectCall" BOOLEAN NOT NULL DEFAULT false,
    "msgCall" VARCHAR(100),
    "groupsIgnore" BOOLEAN NOT NULL DEFAULT false,
    "alwaysOnline" BOOLEAN NOT NULL DEFAULT false,
    "readMessages" BOOLEAN NOT NULL DEFAULT false,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "syncFullHistory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "wavoipToken" VARCHAR(100),

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sqs" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Sqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "templateId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "template" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "webhookUrl" VARCHAR(500),

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Typebot" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "url" VARCHAR(500) NOT NULL,
    "typebot" VARCHAR(100) NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "instanceId" TEXT NOT NULL,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "description" VARCHAR(255),
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "Typebot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypebotSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "debounceTime" INTEGER,
    "typebotIdFallback" VARCHAR(100),
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "TypebotSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "events" JSONB,
    "webhookByEvents" BOOLEAN DEFAULT false,
    "webhookBase64" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "headers" JSONB,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Websocket" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Websocket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_api_tokens" (
    "id" SERIAL NOT NULL,
    "base_id" VARCHAR(20),
    "db_alias" VARCHAR(255),
    "description" VARCHAR(255),
    "permissions" TEXT,
    "token" TEXT,
    "expiry" VARCHAR(255),
    "enabled" BOOLEAN DEFAULT true,
    "fk_user_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "fk_sso_client_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_audit_v2" (
    "id" UUID NOT NULL,
    "user" VARCHAR(255),
    "ip" VARCHAR(255),
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20),
    "row_id" VARCHAR(255),
    "op_type" VARCHAR(255),
    "op_sub_type" VARCHAR(255),
    "status" VARCHAR(255),
    "description" TEXT,
    "details" TEXT,
    "fk_user_id" VARCHAR(20),
    "fk_ref_id" VARCHAR(20),
    "fk_parent_id" UUID,
    "fk_workspace_id" VARCHAR(20),
    "fk_org_id" VARCHAR(20),
    "user_agent" TEXT,
    "version" SMALLINT DEFAULT 0,
    "old_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_audit_v2_pkx" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_automation_executions" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workflow_id" VARCHAR(20) NOT NULL,
    "workflow_data" TEXT,
    "execution_data" TEXT,
    "finished" BOOLEAN DEFAULT false,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "status" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resume_at" TIMESTAMPTZ(6),
    "error_notified_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_automation_executions_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_automation_subscribers" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_automation_id" VARCHAR(20),
    "fk_user_id" VARCHAR(20),
    "notify_on_error" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_automation_subscribers_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_automations" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "order" REAL,
    "type" VARCHAR(20),
    "created_by" VARCHAR(20),
    "updated_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled" BOOLEAN DEFAULT false,
    "nodes" TEXT,
    "edges" TEXT,
    "draft" TEXT,
    "config" TEXT,
    "script" TEXT,

    CONSTRAINT "nc_automations_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_base_users_v2" (
    "base_id" VARCHAR(20) NOT NULL,
    "fk_user_id" VARCHAR(20) NOT NULL,
    "roles" TEXT,
    "starred" BOOLEAN,
    "pinned" BOOLEAN,
    "group" VARCHAR(255),
    "color" VARCHAR(255),
    "order" REAL,
    "hidden" REAL,
    "opened_date" TIMESTAMPTZ(6),
    "invited_by" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_base_users_v2_pkey" PRIMARY KEY ("base_id","fk_user_id")
);

-- CreateTable
CREATE TABLE "nc_bases_v2" (
    "id" VARCHAR(128) NOT NULL,
    "title" VARCHAR(255),
    "prefix" VARCHAR(255),
    "status" VARCHAR(255),
    "description" TEXT,
    "meta" TEXT,
    "color" VARCHAR(255),
    "uuid" VARCHAR(255),
    "password" VARCHAR(255),
    "roles" VARCHAR(255),
    "deleted" BOOLEAN DEFAULT false,
    "is_meta" BOOLEAN,
    "order" REAL,
    "type" VARCHAR(200),
    "fk_workspace_id" VARCHAR(20),
    "is_snapshot" BOOLEAN DEFAULT false,
    "fk_custom_url_id" VARCHAR(20),
    "version" SMALLINT DEFAULT 2,
    "default_role" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "managed_app_master" BOOLEAN DEFAULT false,
    "managed_app_id" VARCHAR(20),
    "managed_app_version_id" VARCHAR(20),
    "auto_update" BOOLEAN DEFAULT true,
    "is_sandbox_master" BOOLEAN DEFAULT false,
    "is_sandbox" BOOLEAN DEFAULT false,

    CONSTRAINT "nc_projects_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_calendar_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "show" BOOLEAN,
    "bold" BOOLEAN,
    "underline" BOOLEAN,
    "italic" BOOLEAN,
    "order" REAL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_calendar_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_calendar_view_range_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_to_column_id" VARCHAR(20),
    "label" VARCHAR(40),
    "fk_from_column_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_calendar_view_range_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_calendar_view_v2" (
    "fk_view_id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "title" VARCHAR(255),
    "fk_cover_image_col_id" VARCHAR(20),
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_calendar_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_col_barcode_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20),
    "fk_barcode_value_column_id" VARCHAR(20),
    "barcode_format" VARCHAR(15),
    "deleted" BOOLEAN,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_barcode_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_button_v2" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "type" VARCHAR(255),
    "label" TEXT,
    "theme" VARCHAR(255),
    "color" VARCHAR(255),
    "icon" VARCHAR(255),
    "formula" TEXT,
    "formula_raw" TEXT,
    "error" VARCHAR(255),
    "parsed_tree" TEXT,
    "fk_webhook_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "fk_integration_id" VARCHAR(20),
    "model" VARCHAR(255),
    "output_column_ids" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "fk_script_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_button_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_formula_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20),
    "formula" TEXT NOT NULL,
    "formula_raw" TEXT,
    "error" TEXT,
    "deleted" BOOLEAN,
    "order" REAL,
    "parsed_tree" TEXT,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_formula_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_long_text_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "fk_integration_id" VARCHAR(20),
    "model" VARCHAR(255),
    "prompt" TEXT,
    "prompt_raw" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_long_text_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_lookup_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20),
    "fk_relation_column_id" VARCHAR(20),
    "fk_lookup_column_id" VARCHAR(20),
    "deleted" BOOLEAN,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_lookup_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_qrcode_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20),
    "fk_qr_value_column_id" VARCHAR(20),
    "deleted" BOOLEAN,
    "order" REAL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_qrcode_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_relations_v2" (
    "id" VARCHAR(20) NOT NULL,
    "ref_db_alias" VARCHAR(255),
    "type" VARCHAR(255),
    "virtual" BOOLEAN,
    "db_type" VARCHAR(255),
    "fk_column_id" VARCHAR(20),
    "fk_related_model_id" VARCHAR(20),
    "fk_child_column_id" VARCHAR(20),
    "fk_parent_column_id" VARCHAR(20),
    "fk_mm_model_id" VARCHAR(20),
    "fk_mm_child_column_id" VARCHAR(20),
    "fk_mm_parent_column_id" VARCHAR(20),
    "ur" VARCHAR(255),
    "dr" VARCHAR(255),
    "fk_index_name" VARCHAR(255),
    "deleted" BOOLEAN,
    "fk_target_view_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "fk_related_base_id" VARCHAR(20),
    "fk_mm_base_id" VARCHAR(20),
    "fk_related_source_id" VARCHAR(20),
    "fk_mm_source_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER DEFAULT 1,

    CONSTRAINT "nc_col_relations_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_rollup_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20),
    "fk_relation_column_id" VARCHAR(20),
    "fk_rollup_column_id" VARCHAR(20),
    "rollup_function" VARCHAR(255),
    "deleted" BOOLEAN,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_rollup_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_col_select_options_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20),
    "title" VARCHAR(255),
    "color" VARCHAR(255),
    "order" REAL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_col_select_options_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "title" VARCHAR(255),
    "column_name" VARCHAR(255),
    "uidt" VARCHAR(255),
    "dt" VARCHAR(255),
    "np" VARCHAR(255),
    "ns" VARCHAR(255),
    "clen" VARCHAR(255),
    "cop" VARCHAR(255),
    "pk" BOOLEAN,
    "pv" BOOLEAN,
    "rqd" BOOLEAN,
    "un" BOOLEAN,
    "ct" TEXT,
    "ai" BOOLEAN,
    "unique" BOOLEAN,
    "cdf" TEXT,
    "cc" TEXT,
    "csn" VARCHAR(255),
    "dtx" VARCHAR(255),
    "dtxp" TEXT,
    "dtxs" VARCHAR(255),
    "au" BOOLEAN,
    "validate" TEXT,
    "virtual" BOOLEAN,
    "deleted" BOOLEAN,
    "system" BOOLEAN DEFAULT false,
    "order" REAL,
    "meta" TEXT,
    "description" TEXT,
    "readonly" BOOLEAN DEFAULT false,
    "fk_workspace_id" VARCHAR(20),
    "custom_index_name" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "internal_meta" TEXT,

    CONSTRAINT "nc_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_comment_reactions" (
    "id" VARCHAR(20) NOT NULL,
    "row_id" VARCHAR(255),
    "comment_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "reaction" VARCHAR(255),
    "created_by" VARCHAR(255),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_comment_reactions_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_comments" (
    "id" VARCHAR(20) NOT NULL,
    "row_id" VARCHAR(255),
    "comment" TEXT,
    "created_by" VARCHAR(20),
    "created_by_email" VARCHAR(255),
    "resolved_by" VARCHAR(20),
    "resolved_by_email" VARCHAR(255),
    "parent_comment_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "is_deleted" BOOLEAN,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_comments_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_custom_urls_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "view_id" VARCHAR(20),
    "original_path" VARCHAR(255),
    "custom_path" VARCHAR(255),
    "fk_dashboard_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_custom_urls_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_dashboards_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "meta" TEXT,
    "order" INTEGER,
    "created_by" VARCHAR(20),
    "owned_by" VARCHAR(20),
    "uuid" VARCHAR(255),
    "password" VARCHAR(255),
    "fk_custom_url_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_dashboards_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_data_reflection" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "username" VARCHAR(255),
    "password" VARCHAR(255),
    "database" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_data_reflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_db_servers" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "is_shared" BOOLEAN DEFAULT true,
    "max_tenant_count" INTEGER,
    "current_tenant_count" INTEGER DEFAULT 0,
    "config" TEXT,
    "conditions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_db_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_dependency_tracker" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "source_id" VARCHAR(20) NOT NULL,
    "dependent_type" VARCHAR(50) NOT NULL,
    "dependent_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queryable_field_0" TEXT,
    "queryable_field_1" TEXT,
    "meta" TEXT,
    "queryable_field_2" TIMESTAMPTZ(6),

    CONSTRAINT "nc_dependency_tracker_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_disabled_models_for_role_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "role" VARCHAR(45),
    "disabled" BOOLEAN DEFAULT true,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_disabled_models_for_role_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_extensions" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_user_id" VARCHAR(20),
    "extension_id" VARCHAR(255),
    "title" VARCHAR(255),
    "kv_store" TEXT,
    "meta" TEXT,
    "order" REAL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_extensions_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_file_references" (
    "id" VARCHAR(20) NOT NULL,
    "storage" VARCHAR(255),
    "file_url" TEXT,
    "file_size" INTEGER,
    "fk_user_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "is_external" BOOLEAN DEFAULT false,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_file_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_filter_exp_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_hook_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "fk_parent_id" VARCHAR(20),
    "logical_op" VARCHAR(255),
    "comparison_op" VARCHAR(255),
    "value" TEXT,
    "is_group" BOOLEAN,
    "order" REAL,
    "comparison_sub_op" VARCHAR(255),
    "fk_link_col_id" VARCHAR(20),
    "fk_value_col_id" VARCHAR(20),
    "fk_parent_column_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "fk_row_color_condition_id" VARCHAR(20),
    "fk_widget_id" VARCHAR(20),
    "meta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled" BOOLEAN DEFAULT true,
    "fk_rls_policy_id" VARCHAR(20),
    "fk_level_id" VARCHAR(20),
    "fk_button_col_id" VARCHAR(20),

    CONSTRAINT "nc_filter_exp_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_follower" (
    "fk_user_id" VARCHAR(20) NOT NULL,
    "fk_follower_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_follower_pkey" PRIMARY KEY ("fk_user_id","fk_follower_id")
);

-- CreateTable
CREATE TABLE "nc_form_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "uuid" VARCHAR(255),
    "label" TEXT,
    "help" TEXT,
    "description" TEXT,
    "required" BOOLEAN,
    "show" BOOLEAN,
    "order" REAL,
    "meta" TEXT,
    "enable_scanner" BOOLEAN,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_form_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_form_view_v2" (
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20) NOT NULL,
    "heading" VARCHAR(255),
    "subheading" TEXT,
    "success_msg" TEXT,
    "redirect_url" TEXT,
    "redirect_after_secs" VARCHAR(255),
    "email" VARCHAR(255),
    "submit_another_form" BOOLEAN,
    "show_blank_form" BOOLEAN,
    "uuid" VARCHAR(255),
    "banner_image_url" TEXT,
    "logo_url" TEXT,
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_form_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_gallery_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "uuid" VARCHAR(255),
    "label" VARCHAR(255),
    "help" VARCHAR(255),
    "show" BOOLEAN,
    "order" REAL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_gallery_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_gallery_view_v2" (
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20) NOT NULL,
    "next_enabled" BOOLEAN,
    "prev_enabled" BOOLEAN,
    "cover_image_idx" INTEGER,
    "fk_cover_image_col_id" VARCHAR(20),
    "cover_image" VARCHAR(255),
    "restrict_types" VARCHAR(255),
    "restrict_size" VARCHAR(255),
    "restrict_number" VARCHAR(255),
    "public" BOOLEAN,
    "dimensions" VARCHAR(255),
    "responsive_columns" VARCHAR(255),
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_gallery_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_grid_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "uuid" VARCHAR(255),
    "label" VARCHAR(255),
    "help" VARCHAR(255),
    "width" VARCHAR(255) DEFAULT '200px',
    "show" BOOLEAN,
    "order" REAL,
    "group_by" BOOLEAN,
    "group_by_order" REAL,
    "group_by_sort" VARCHAR(255),
    "aggregation" VARCHAR(30),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_grid_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_grid_view_v2" (
    "fk_view_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "uuid" VARCHAR(255),
    "meta" TEXT,
    "row_height" INTEGER,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_grid_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_hook_logs_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_hook_id" VARCHAR(20),
    "type" VARCHAR(255),
    "event" VARCHAR(255),
    "operation" VARCHAR(255),
    "test_call" BOOLEAN DEFAULT true,
    "payload" TEXT,
    "conditions" TEXT,
    "notification" TEXT,
    "error_code" VARCHAR(255),
    "error_message" VARCHAR(255),
    "error" TEXT,
    "execution_time" INTEGER,
    "response" TEXT,
    "triggered_by" VARCHAR(255),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_hook_logs_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_hook_trigger_fields" (
    "fk_hook_id" VARCHAR(20) NOT NULL,
    "fk_column_id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_hook_trigger_fields_pkey" PRIMARY KEY ("fk_workspace_id","base_id","fk_hook_id","fk_column_id")
);

-- CreateTable
CREATE TABLE "nc_hooks_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "title" VARCHAR(255),
    "description" VARCHAR(255),
    "env" VARCHAR(255) DEFAULT 'all',
    "type" VARCHAR(255),
    "event" VARCHAR(255),
    "operation" VARCHAR(255),
    "async" BOOLEAN DEFAULT false,
    "payload" BOOLEAN DEFAULT true,
    "url" TEXT,
    "headers" TEXT,
    "condition" BOOLEAN DEFAULT false,
    "notification" TEXT,
    "retries" INTEGER DEFAULT 0,
    "retry_interval" INTEGER DEFAULT 60000,
    "timeout" INTEGER DEFAULT 60000,
    "active" BOOLEAN DEFAULT true,
    "version" VARCHAR(255),
    "trigger_field" BOOLEAN DEFAULT false,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_hooks_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_installations" (
    "id" VARCHAR(20) NOT NULL,
    "fk_subscription_id" VARCHAR(20),
    "licensed_to" VARCHAR(255) NOT NULL,
    "license_key" VARCHAR(255) NOT NULL,
    "installation_secret" VARCHAR(255),
    "installed_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "license_type" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'active',
    "seat_count" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT,
    "meta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_integrations_store_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_integration_id" VARCHAR(20),
    "type" VARCHAR(20),
    "sub_type" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "fk_user_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slot_0" TEXT,
    "slot_1" TEXT,
    "slot_2" TEXT,
    "slot_3" TEXT,
    "slot_4" TEXT,
    "slot_5" INTEGER,
    "slot_6" INTEGER,
    "slot_7" INTEGER,
    "slot_8" INTEGER,
    "slot_9" INTEGER,

    CONSTRAINT "nc_integrations_store_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_integrations_v2" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(128),
    "config" TEXT,
    "meta" TEXT,
    "type" VARCHAR(20),
    "sub_type" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "is_private" BOOLEAN DEFAULT false,
    "deleted" BOOLEAN DEFAULT false,
    "created_by" VARCHAR(20),
    "order" REAL,
    "is_default" BOOLEAN DEFAULT false,
    "is_encrypted" BOOLEAN DEFAULT false,
    "is_global" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_integrations_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_jobs" (
    "id" VARCHAR(20) NOT NULL,
    "job" VARCHAR(255),
    "status" VARCHAR(20),
    "result" TEXT,
    "fk_user_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_kanban_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "uuid" VARCHAR(255),
    "label" VARCHAR(255),
    "help" VARCHAR(255),
    "show" BOOLEAN,
    "order" REAL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_kanban_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_kanban_view_v2" (
    "fk_view_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "show" BOOLEAN,
    "order" REAL,
    "uuid" VARCHAR(255),
    "title" VARCHAR(255),
    "public" BOOLEAN,
    "password" VARCHAR(255),
    "show_all_fields" BOOLEAN,
    "fk_grp_col_id" VARCHAR(20),
    "fk_cover_image_col_id" VARCHAR(20),
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_kanban_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_list_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(128),
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "fk_level_id" VARCHAR(20),
    "show" BOOLEAN,
    "order" REAL,
    "width" VARCHAR(255),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_outline_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_list_view_levels_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "level" INTEGER,
    "fk_model_id" VARCHAR(20),
    "fk_link_column_id" VARCHAR(20),
    "enable_nested_records" BOOLEAN,
    "fk_self_link_column_id" VARCHAR(20),
    "wrap_headers" BOOLEAN,
    "meta" TEXT,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_outline_view_levels_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_list_view_v2" (
    "fk_view_id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(128),
    "title" VARCHAR(255),
    "show_empty_parents" BOOLEAN,
    "row_height" INTEGER,
    "fk_prefix_column_id" VARCHAR(20),
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_outline_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_managed_app_deployment_logs" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_managed_app_id" VARCHAR(20) NOT NULL,
    "from_version_id" VARCHAR(20),
    "to_version_id" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "deployment_type" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "deployment_log" TEXT,
    "meta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_sandbox_deployment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_managed_app_versions" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "fk_managed_app_id" VARCHAR(20) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "schema" TEXT,
    "release_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_sandbox_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_managed_apps" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_by" VARCHAR(20) NOT NULL,
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'private',
    "category" VARCHAR(255),
    "install_count" INTEGER DEFAULT 0,
    "meta" TEXT,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_sandboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_map_view_columns_v2" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "project_id" VARCHAR(128),
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "uuid" VARCHAR(255),
    "label" VARCHAR(255),
    "help" VARCHAR(255),
    "show" BOOLEAN,
    "order" REAL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_map_view_columns_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_map_view_v2" (
    "fk_view_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "uuid" VARCHAR(255),
    "title" VARCHAR(255),
    "fk_geo_data_col_id" VARCHAR(20),
    "meta" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_map_view_v2_pkey" PRIMARY KEY ("base_id","fk_view_id")
);

-- CreateTable
CREATE TABLE "nc_mcp_tokens" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(512),
    "base_id" VARCHAR(20) NOT NULL,
    "token" VARCHAR(32),
    "fk_workspace_id" VARCHAR(20),
    "order" REAL,
    "fk_user_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_mcp_tokens_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_model_stats_v2" (
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20) NOT NULL,
    "row_count" INTEGER DEFAULT 0,
    "is_external" BOOLEAN DEFAULT false,
    "base_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_model_stats_v2_pkey" PRIMARY KEY ("fk_workspace_id","base_id","fk_model_id")
);

-- CreateTable
CREATE TABLE "nc_models_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "table_name" VARCHAR(255),
    "title" VARCHAR(255),
    "type" VARCHAR(255) DEFAULT 'table',
    "meta" TEXT,
    "schema" TEXT,
    "enabled" BOOLEAN DEFAULT true,
    "mm" BOOLEAN DEFAULT false,
    "tags" VARCHAR(255),
    "pinned" BOOLEAN,
    "deleted" BOOLEAN,
    "order" REAL,
    "description" TEXT,
    "synced" BOOLEAN DEFAULT false,
    "fk_workspace_id" VARCHAR(20),
    "created_by" VARCHAR(20),
    "owned_by" VARCHAR(20),
    "uuid" VARCHAR(255),
    "password" VARCHAR(255),
    "fk_custom_url_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_models_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_oauth_authorization_codes" (
    "code" VARCHAR(32) NOT NULL,
    "fk_client_id" VARCHAR(32),
    "fk_user_id" VARCHAR(20),
    "code_challenge" VARCHAR(255),
    "code_challenge_method" VARCHAR(10) DEFAULT 'S256',
    "redirect_uri" VARCHAR(255),
    "scope" VARCHAR(255),
    "state" VARCHAR(1024),
    "resource" VARCHAR(255),
    "granted_resources" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_oauth_authorization_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "nc_oauth_clients" (
    "client_id" VARCHAR(32) NOT NULL,
    "client_secret" VARCHAR(128),
    "client_type" VARCHAR(255),
    "client_name" VARCHAR(255),
    "client_description" TEXT,
    "client_uri" VARCHAR(255),
    "logo_uri" VARCHAR(255),
    "redirect_uris" TEXT,
    "allowed_grant_types" TEXT,
    "response_types" TEXT,
    "allowed_scopes" TEXT,
    "registration_access_token" VARCHAR(255),
    "registration_client_uri" VARCHAR(255),
    "client_id_issued_at" BIGINT,
    "client_secret_expires_at" BIGINT,
    "fk_user_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_oauth_clients_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "nc_oauth_tokens" (
    "id" VARCHAR(20) NOT NULL,
    "fk_client_id" VARCHAR(32),
    "fk_user_id" VARCHAR(20),
    "access_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(6),
    "refresh_token" TEXT,
    "refresh_token_expires_at" TIMESTAMPTZ(6),
    "resource" VARCHAR(255),
    "audience" VARCHAR(255),
    "granted_resources" TEXT,
    "scope" VARCHAR(255),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_org" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "slug" VARCHAR(255),
    "fk_user_id" VARCHAR(20),
    "meta" TEXT,
    "image" VARCHAR(255),
    "is_share_enabled" BOOLEAN DEFAULT false,
    "deleted" BOOLEAN DEFAULT false,
    "order" REAL,
    "fk_db_instance_id" VARCHAR(20),
    "stripe_customer_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_org_domain" (
    "id" VARCHAR(20) NOT NULL,
    "fk_org_id" VARCHAR(20),
    "fk_user_id" VARCHAR(20),
    "domain" VARCHAR(255),
    "verified" BOOLEAN,
    "txt_value" VARCHAR(255),
    "last_verified" TIMESTAMPTZ(6),
    "deleted" BOOLEAN DEFAULT false,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_org_domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_org_users" (
    "fk_org_id" VARCHAR(20) NOT NULL,
    "fk_user_id" VARCHAR(20),
    "roles" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_org_users_pkey" PRIMARY KEY ("fk_org_id")
);

-- CreateTable
CREATE TABLE "nc_permission_subjects" (
    "fk_permission_id" VARCHAR(20) NOT NULL,
    "subject_type" VARCHAR(255) NOT NULL,
    "subject_id" VARCHAR(255) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_permission_subjects_pkey" PRIMARY KEY ("base_id","fk_permission_id","subject_type","subject_id")
);

-- CreateTable
CREATE TABLE "nc_permissions" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "entity" VARCHAR(255),
    "entity_id" VARCHAR(255),
    "permission" VARCHAR(255),
    "created_by" VARCHAR(20),
    "enforce_for_form" BOOLEAN DEFAULT true,
    "enforce_for_automation" BOOLEAN DEFAULT true,
    "granted_type" VARCHAR(255),
    "granted_role" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_permissions_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_plans" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "stripe_product_id" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "prices" TEXT,
    "meta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_plugins_v2" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(45),
    "description" TEXT,
    "active" BOOLEAN DEFAULT false,
    "rating" REAL,
    "version" VARCHAR(255),
    "docs" VARCHAR(255),
    "status" VARCHAR(255) DEFAULT 'install',
    "status_details" VARCHAR(255),
    "logo" VARCHAR(255),
    "icon" VARCHAR(255),
    "tags" VARCHAR(255),
    "category" VARCHAR(255),
    "input_schema" TEXT,
    "input" TEXT,
    "creator" VARCHAR(255),
    "creator_website" VARCHAR(255),
    "price" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_plugins_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_principal_assignments" (
    "resource_type" VARCHAR(20) NOT NULL,
    "resource_id" VARCHAR(20) NOT NULL,
    "principal_type" VARCHAR(20) NOT NULL,
    "principal_ref_id" VARCHAR(20) NOT NULL,
    "roles" VARCHAR(255) NOT NULL,
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_principal_assignments_pk" PRIMARY KEY ("resource_type","resource_id","principal_type","principal_ref_id")
);

-- CreateTable
CREATE TABLE "nc_record_templates" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "template_data" TEXT NOT NULL,
    "usage_count" INTEGER DEFAULT 0,
    "enabled" BOOLEAN DEFAULT true,
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_record_templates_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_rls_policies" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "enabled" BOOLEAN DEFAULT true,
    "is_default" BOOLEAN DEFAULT false,
    "default_behavior" VARCHAR(20),
    "order" REAL,
    "meta" TEXT,
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_rls_policies_pk" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_rls_policy_subjects" (
    "fk_rls_policy_id" VARCHAR(20) NOT NULL,
    "subject_type" VARCHAR(255) NOT NULL,
    "subject_id" VARCHAR(255) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_rls_policy_subjects_pk" PRIMARY KEY ("fk_rls_policy_id","subject_type","subject_id")
);

-- CreateTable
CREATE TABLE "nc_row_color_conditions" (
    "id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "color" VARCHAR(20),
    "nc_order" REAL,
    "is_set_as_background" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(20) DEFAULT 'row',
    "fk_target_column_id" VARCHAR(20),

    CONSTRAINT "nc_row_color_conditions_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_sandboxes_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "master_base_id" VARCHAR(20) NOT NULL,
    "sandbox_base_id" VARCHAR(20) NOT NULL,
    "created_by" VARCHAR(20) NOT NULL,
    "meta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sandboxes_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_scim_config" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "enabled" BOOLEAN DEFAULT false,
    "provisioning_token" TEXT NOT NULL,
    "role_mapping" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_scim_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_scripts" (
    "id" VARCHAR(20) NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "meta" TEXT,
    "order" REAL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "script" TEXT,
    "config" TEXT,
    "created_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_scripts_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_snapshots" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(512),
    "base_id" VARCHAR(20),
    "snapshot_base_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "created_by" VARCHAR(20),
    "status" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_sort_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_view_id" VARCHAR(20),
    "fk_column_id" VARCHAR(20),
    "direction" VARCHAR(255) DEFAULT 'false',
    "order" REAL,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fk_level_id" VARCHAR(20),

    CONSTRAINT "nc_sort_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_sources_v2" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "alias" VARCHAR(255),
    "config" TEXT,
    "meta" TEXT,
    "is_meta" BOOLEAN,
    "type" VARCHAR(255),
    "inflection_column" VARCHAR(255),
    "inflection_table" VARCHAR(255),
    "enabled" BOOLEAN DEFAULT true,
    "order" REAL,
    "description" VARCHAR(255),
    "erd_uuid" VARCHAR(255),
    "deleted" BOOLEAN DEFAULT false,
    "is_schema_readonly" BOOLEAN DEFAULT false,
    "is_data_readonly" BOOLEAN DEFAULT false,
    "is_local" BOOLEAN DEFAULT false,
    "fk_sql_executor_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "fk_integration_id" VARCHAR(20),
    "is_encrypted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_bases_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_sql_executor_v2" (
    "id" VARCHAR(20) NOT NULL,
    "domain" VARCHAR(50),
    "status" VARCHAR(20),
    "priority" INTEGER,
    "capacity" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sql_executor_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_sso_client" (
    "id" VARCHAR(20) NOT NULL,
    "type" VARCHAR(20),
    "title" VARCHAR(255),
    "enabled" BOOLEAN DEFAULT true,
    "config" TEXT,
    "fk_user_id" VARCHAR(20),
    "fk_org_id" VARCHAR(20),
    "deleted" BOOLEAN DEFAULT false,
    "order" REAL,
    "domain_name" VARCHAR(255),
    "domain_name_verified" BOOLEAN,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sso_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_sso_client_domain" (
    "fk_sso_client_id" VARCHAR(20) NOT NULL,
    "fk_org_domain_id" VARCHAR(20),
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sso_client_domain_pkey" PRIMARY KEY ("fk_sso_client_id")
);

-- CreateTable
CREATE TABLE "nc_store" (
    "id" SERIAL NOT NULL,
    "base_id" VARCHAR(255),
    "db_alias" VARCHAR(255) DEFAULT 'db',
    "key" VARCHAR(255),
    "value" TEXT,
    "type" VARCHAR(255),
    "env" VARCHAR(255),
    "tag" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "nc_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_subscriptions" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "fk_org_id" VARCHAR(20),
    "fk_plan_id" VARCHAR(20) NOT NULL,
    "fk_user_id" VARCHAR(20),
    "stripe_subscription_id" VARCHAR(255),
    "stripe_price_id" VARCHAR(255),
    "seat_count" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(255),
    "billing_cycle_anchor" TIMESTAMPTZ(6),
    "start_at" TIMESTAMPTZ(6),
    "trial_end_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "period" VARCHAR(255),
    "upcoming_invoice_at" TIMESTAMPTZ(6),
    "upcoming_invoice_due_at" TIMESTAMPTZ(6),
    "upcoming_invoice_amount" INTEGER,
    "upcoming_invoice_currency" VARCHAR(255),
    "stripe_schedule_id" VARCHAR(255),
    "schedule_phase_start" TIMESTAMPTZ(6),
    "schedule_stripe_price_id" VARCHAR(255),
    "schedule_fk_plan_id" VARCHAR(20),
    "schedule_period" VARCHAR(255),
    "schedule_type" VARCHAR(255),
    "meta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_sync_configs" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_integration_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20),
    "sync_type" VARCHAR(255),
    "sync_trigger" VARCHAR(255),
    "sync_trigger_cron" VARCHAR(255),
    "sync_trigger_secret" VARCHAR(255),
    "sync_job_id" VARCHAR(255),
    "last_sync_at" TIMESTAMPTZ(6),
    "next_sync_at" TIMESTAMPTZ(6),
    "title" VARCHAR(255),
    "sync_category" VARCHAR(255),
    "fk_parent_sync_config_id" VARCHAR(20),
    "on_delete_action" VARCHAR(255) DEFAULT 'mark_deleted',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(20),
    "updated_by" VARCHAR(20),
    "meta" TEXT,

    CONSTRAINT "nc_sync_configs_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_sync_logs_v2" (
    "id" VARCHAR(20) NOT NULL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_sync_source_id" VARCHAR(20),
    "time_taken" INTEGER,
    "status" VARCHAR(255),
    "status_details" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sync_logs_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_sync_mappings" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_sync_config_id" VARCHAR(20),
    "target_table" VARCHAR(255),
    "fk_model_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sync_mappings_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_sync_source_v2" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "type" VARCHAR(255),
    "details" TEXT,
    "deleted" BOOLEAN,
    "enabled" BOOLEAN DEFAULT true,
    "order" REAL,
    "base_id" VARCHAR(20) NOT NULL,
    "fk_user_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_sync_source_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_teams" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "meta" TEXT,
    "fk_org_id" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "created_by" VARCHAR(20),
    "deleted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scim_external_id" VARCHAR(255),
    "scim_managed" BOOLEAN DEFAULT false,
    "scim_display_name" VARCHAR(255),
    "scim_meta" TEXT,

    CONSTRAINT "nc_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_usage_stats" (
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "usage_type" VARCHAR(255) NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_usage_stats_pkey" PRIMARY KEY ("fk_workspace_id","usage_type","period_start")
);

-- CreateTable
CREATE TABLE "nc_user_comment_notifications_preference" (
    "id" VARCHAR(20) NOT NULL,
    "row_id" VARCHAR(255),
    "user_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "preferences" VARCHAR(255),
    "fk_workspace_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_user_comment_notifications_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_user_refresh_tokens" (
    "fk_user_id" VARCHAR(20),
    "token" VARCHAR(255),
    "meta" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "nc_users_v2" (
    "id" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "password" VARCHAR(255),
    "salt" VARCHAR(255),
    "invite_token" VARCHAR(255),
    "invite_token_expires" VARCHAR(255),
    "reset_password_expires" TIMESTAMPTZ(6),
    "reset_password_token" VARCHAR(255),
    "email_verification_token" VARCHAR(255),
    "email_verified" BOOLEAN,
    "roles" VARCHAR(255) DEFAULT 'editor',
    "token_version" VARCHAR(255),
    "blocked" BOOLEAN DEFAULT false,
    "blocked_reason" VARCHAR(255),
    "deleted_at" TIMESTAMPTZ(6),
    "is_deleted" BOOLEAN DEFAULT false,
    "meta" TEXT,
    "display_name" VARCHAR(255),
    "user_name" VARCHAR(255),
    "bio" VARCHAR(255),
    "location" VARCHAR(255),
    "website" VARCHAR(255),
    "avatar" VARCHAR(255),
    "is_new_user" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canonical_email" VARCHAR(255),

    CONSTRAINT "nc_users_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_view_sections" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "source_id" VARCHAR(20),
    "fk_model_id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "order" REAL,
    "meta" TEXT,
    "created_by" VARCHAR(20),
    "updated_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_view_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nc_views_v2" (
    "id" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "title" VARCHAR(255),
    "type" INTEGER,
    "is_default" BOOLEAN,
    "show_system_fields" BOOLEAN,
    "lock_type" VARCHAR(255) DEFAULT 'collaborative',
    "uuid" VARCHAR(255),
    "password" VARCHAR(255),
    "show" BOOLEAN,
    "order" REAL,
    "meta" TEXT,
    "description" TEXT,
    "created_by" VARCHAR(20),
    "owned_by" VARCHAR(20),
    "fk_workspace_id" VARCHAR(20),
    "attachment_mode_column_id" VARCHAR(20),
    "expanded_record_mode" VARCHAR(255),
    "fk_custom_url_id" VARCHAR(20),
    "row_coloring_mode" VARCHAR(10),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fk_view_section_id" VARCHAR(20),

    CONSTRAINT "nc_views_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_widgets_v2" (
    "id" VARCHAR(20) NOT NULL,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20) NOT NULL,
    "fk_dashboard_id" VARCHAR(20) NOT NULL,
    "fk_model_id" VARCHAR(20),
    "fk_view_id" VARCHAR(20),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "config" TEXT,
    "meta" TEXT,
    "order" INTEGER,
    "position" TEXT,
    "error" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nc_widgets_v2_pkey" PRIMARY KEY ("base_id","id")
);

-- CreateTable
CREATE TABLE "nc_workflows" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "fk_workspace_id" VARCHAR(20),
    "base_id" VARCHAR(20),
    "enabled" BOOLEAN DEFAULT false,
    "nodes" TEXT,
    "edges" TEXT,
    "meta" TEXT,
    "order" REAL,
    "created_by" VARCHAR(20),
    "updated_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "draft" TEXT,

    CONSTRAINT "nc_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" VARCHAR(20) NOT NULL,
    "type" VARCHAR(40),
    "body" TEXT,
    "is_read" BOOLEAN DEFAULT false,
    "is_deleted" BOOLEAN DEFAULT false,
    "fk_user_id" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "meta" TEXT,
    "fk_user_id" VARCHAR(20),
    "deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "order" REAL,
    "status" SMALLINT DEFAULT 0,
    "message" VARCHAR(256),
    "plan" VARCHAR(20) DEFAULT 'free',
    "infra_meta" TEXT,
    "fk_org_id" VARCHAR(20),
    "stripe_customer_id" VARCHAR(255),
    "grace_period_start_at" TIMESTAMPTZ(6),
    "api_grace_period_start_at" TIMESTAMPTZ(6),
    "automation_grace_period_start_at" TIMESTAMPTZ(6),
    "loyal" BOOLEAN DEFAULT false,
    "loyalty_discount_used" BOOLEAN DEFAULT false,
    "db_job_id" VARCHAR(20),
    "fk_db_instance_id" VARCHAR(20),
    "segment_code" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_user" (
    "fk_workspace_id" VARCHAR(20) NOT NULL,
    "fk_user_id" VARCHAR(20) NOT NULL,
    "roles" VARCHAR(255),
    "invite_token" VARCHAR(255),
    "invite_accepted" BOOLEAN DEFAULT false,
    "deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "order" REAL,
    "invited_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scim_external_id" VARCHAR(255),
    "scim_managed" BOOLEAN DEFAULT false,
    "scim_user_name" VARCHAR(255),
    "scim_meta" TEXT,

    CONSTRAINT "workspace_user_pkey" PRIMARY KEY ("fk_workspace_id","fk_user_id")
);

-- CreateTable
CREATE TABLE "xc_knex_migrationsv0" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "batch" INTEGER,
    "migration_time" TIMESTAMPTZ(6),

    CONSTRAINT "xc_knex_migrationsv0_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_knex_migrationsv0_lock" (
    "index" SERIAL NOT NULL,
    "is_locked" INTEGER,

    CONSTRAINT "xc_knex_migrationsv0_lock_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "PanelUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'empresa',
    "instance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PanelUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "instance" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chat_instanceId_idx" ON "Chat"("instanceId");

-- CreateIndex
CREATE INDEX "Chat_remoteJid_idx" ON "Chat"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_instanceId_remoteJid_key" ON "Chat"("instanceId", "remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Chatwoot_instanceId_key" ON "Chatwoot"("instanceId");

-- CreateIndex
CREATE INDEX "Contact_instanceId_idx" ON "Contact"("instanceId");

-- CreateIndex
CREATE INDEX "Contact_remoteJid_idx" ON "Contact"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_remoteJid_instanceId_key" ON "Contact"("remoteJid", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "DifySetting_instanceId_key" ON "DifySetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "EvoaiSetting_instanceId_key" ON "EvoaiSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionBotSetting_instanceId_key" ON "EvolutionBotSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowiseSetting_instanceId_key" ON "FlowiseSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_name_key" ON "Instance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IsOnWhatsapp_remoteJid_key" ON "IsOnWhatsapp"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Kafka_instanceId_key" ON "Kafka"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_labelId_instanceId_key" ON "Label"("labelId", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_messageId_key" ON "Media"("messageId");

-- CreateIndex
CREATE INDEX "Message_instanceId_idx" ON "Message"("instanceId");

-- CreateIndex
CREATE INDEX "MessageUpdate_instanceId_idx" ON "MessageUpdate"("instanceId");

-- CreateIndex
CREATE INDEX "MessageUpdate_messageId_idx" ON "MessageUpdate"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "N8nSetting_instanceId_key" ON "N8nSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Nats_instanceId_key" ON "Nats"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiCreds_apiKey_key" ON "OpenaiCreds"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiCreds_name_key" ON "OpenaiCreds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiSetting_openaiCredsId_key" ON "OpenaiSetting"("openaiCredsId");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiSetting_instanceId_key" ON "OpenaiSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_instanceId_key" ON "Proxy"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Pusher_instanceId_key" ON "Pusher"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Rabbitmq_instanceId_key" ON "Rabbitmq"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_instanceId_key" ON "Setting"("instanceId");

-- CreateIndex
CREATE INDEX "Setting_instanceId_idx" ON "Setting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Sqs_instanceId_key" ON "Sqs"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_templateId_key" ON "Template"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TypebotSetting_instanceId_key" ON "TypebotSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_instanceId_key" ON "Webhook"("instanceId");

-- CreateIndex
CREATE INDEX "Webhook_instanceId_idx" ON "Webhook"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Websocket_instanceId_key" ON "Websocket"("instanceId");

-- CreateIndex
CREATE INDEX "nc_api_tokens_fk_sso_client_id_index" ON "nc_api_tokens"("fk_sso_client_id");

-- CreateIndex
CREATE INDEX "nc_api_tokens_fk_user_id_index" ON "nc_api_tokens"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_audit_v2_fk_workspace_idx" ON "nc_audit_v2"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_audit_v2_old_id_index" ON "nc_audit_v2"("old_id");

-- CreateIndex
CREATE INDEX "nc_audit_v2_tenant_idx" ON "nc_audit_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_record_audit_v2_tenant_idx" ON "nc_audit_v2"("base_id", "fk_model_id", "row_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_automation_executions_error_notify_idx" ON "nc_automation_executions"("status", "error_notified_at");

-- CreateIndex
CREATE INDEX "nc_automation_executions_oldpk_idx" ON "nc_automation_executions"("id");

-- CreateIndex
CREATE INDEX "nc_automation_executions_resume_idx" ON "nc_automation_executions"("fk_workspace_id", "base_id", "resume_at");

-- CreateIndex
CREATE INDEX "nc_workflow_executions_context_idx" ON "nc_automation_executions"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_workflow_executions_workflow_idx" ON "nc_automation_executions"("fk_workflow_id");

-- CreateIndex
CREATE INDEX "nc_automation_subscribers_automation_idx" ON "nc_automation_subscribers"("fk_automation_id");

-- CreateIndex
CREATE INDEX "nc_automation_subscribers_user_idx" ON "nc_automation_subscribers"("fk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "nc_automation_subscribers_unique_idx" ON "nc_automation_subscribers"("fk_automation_id", "fk_user_id");

-- CreateIndex
CREATE INDEX "nc_automations_context_idx" ON "nc_automations"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_automations_enabled_idx" ON "nc_automations"("enabled");

-- CreateIndex
CREATE INDEX "nc_automations_oldpk_idx" ON "nc_automations"("id");

-- CreateIndex
CREATE INDEX "nc_automations_order_idx" ON "nc_automations"("base_id", "order");

-- CreateIndex
CREATE INDEX "nc_automations_type_idx" ON "nc_automations"("type");

-- CreateIndex
CREATE INDEX "nc_base_users_v2_base_id_fk_workspace_id_index" ON "nc_base_users_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_base_users_v2_invited_by_index" ON "nc_base_users_v2"("invited_by");

-- CreateIndex
CREATE INDEX "nc_project_users_v2_fk_user_id_index" ON "nc_base_users_v2"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_bases_is_sandbox_idx" ON "nc_bases_v2"("is_sandbox");

-- CreateIndex
CREATE INDEX "nc_bases_is_sandbox_master_idx" ON "nc_bases_v2"("is_sandbox_master");

-- CreateIndex
CREATE INDEX "nc_bases_managed_app_auto_update_idx" ON "nc_bases_v2"("managed_app_id", "auto_update");

-- CreateIndex
CREATE INDEX "nc_bases_managed_app_id_idx" ON "nc_bases_v2"("managed_app_id");

-- CreateIndex
CREATE INDEX "nc_bases_managed_app_master_idx" ON "nc_bases_v2"("managed_app_master");

-- CreateIndex
CREATE INDEX "nc_bases_managed_app_version_id_idx" ON "nc_bases_v2"("managed_app_version_id");

-- CreateIndex
CREATE INDEX "nc_bases_v2_fk_custom_url_id_index" ON "nc_bases_v2"("fk_custom_url_id");

-- CreateIndex
CREATE INDEX "nc_bases_v2_fk_workspace_id_index" ON "nc_bases_v2"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_calendar_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_calendar_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_columns_v2_oldpk_idx" ON "nc_calendar_view_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_range_v2_base_id_fk_workspace_id_index" ON "nc_calendar_view_range_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_range_v2_oldpk_idx" ON "nc_calendar_view_range_v2"("id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_v2_base_id_fk_workspace_id_index" ON "nc_calendar_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_calendar_view_v2_oldpk_idx" ON "nc_calendar_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_col_barcode_v2_base_id_fk_workspace_id_index" ON "nc_col_barcode_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_barcode_v2_fk_column_id_index" ON "nc_col_barcode_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_barcode_v2_oldpk_idx" ON "nc_col_barcode_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_button_context" ON "nc_col_button_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_button_v2_fk_column_id_index" ON "nc_col_button_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_button_v2_oldpk_idx" ON "nc_col_button_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_formula_v2_base_id_fk_workspace_id_index" ON "nc_col_formula_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_formula_v2_fk_column_id_index" ON "nc_col_formula_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_formula_v2_oldpk_idx" ON "nc_col_formula_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_long_text_context" ON "nc_col_long_text_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_long_text_v2_fk_column_id_index" ON "nc_col_long_text_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_long_text_v2_oldpk_idx" ON "nc_col_long_text_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_lookup_v2_base_id_fk_workspace_id_index" ON "nc_col_lookup_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_lookup_v2_fk_column_id_index" ON "nc_col_lookup_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_lookup_v2_fk_lookup_column_id_index" ON "nc_col_lookup_v2"("fk_lookup_column_id");

-- CreateIndex
CREATE INDEX "nc_col_lookup_v2_fk_relation_column_id_index" ON "nc_col_lookup_v2"("fk_relation_column_id");

-- CreateIndex
CREATE INDEX "nc_col_lookup_v2_oldpk_idx" ON "nc_col_lookup_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_qrcode_v2_base_id_fk_workspace_id_index" ON "nc_col_qrcode_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_qrcode_v2_fk_column_id_index" ON "nc_col_qrcode_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_qrcode_v2_oldpk_idx" ON "nc_col_qrcode_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_base_id_fk_workspace_id_index" ON "nc_col_relations_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_child_column_id_index" ON "nc_col_relations_v2"("fk_child_column_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_column_id_index" ON "nc_col_relations_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_mm_child_column_id_index" ON "nc_col_relations_v2"("fk_mm_child_column_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_mm_model_id_index" ON "nc_col_relations_v2"("fk_mm_model_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_mm_parent_column_id_index" ON "nc_col_relations_v2"("fk_mm_parent_column_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_parent_column_id_index" ON "nc_col_relations_v2"("fk_parent_column_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_related_model_id_index" ON "nc_col_relations_v2"("fk_related_model_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_fk_target_view_id_index" ON "nc_col_relations_v2"("fk_target_view_id");

-- CreateIndex
CREATE INDEX "nc_col_relations_v2_oldpk_idx" ON "nc_col_relations_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_rollup_v2_base_id_fk_workspace_id_index" ON "nc_col_rollup_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_rollup_v2_fk_column_id_index" ON "nc_col_rollup_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_rollup_v2_fk_relation_column_id_index" ON "nc_col_rollup_v2"("fk_relation_column_id");

-- CreateIndex
CREATE INDEX "nc_col_rollup_v2_fk_rollup_column_id_index" ON "nc_col_rollup_v2"("fk_rollup_column_id");

-- CreateIndex
CREATE INDEX "nc_col_rollup_v2_oldpk_idx" ON "nc_col_rollup_v2"("id");

-- CreateIndex
CREATE INDEX "nc_col_select_options_v2_base_id_fk_workspace_id_index" ON "nc_col_select_options_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_col_select_options_v2_fk_column_id_index" ON "nc_col_select_options_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_col_select_options_v2_oldpk_idx" ON "nc_col_select_options_v2"("id");

-- CreateIndex
CREATE INDEX "nc_columns_v2_base_id_fk_workspace_id_index" ON "nc_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_columns_v2_fk_model_id_index" ON "nc_columns_v2"("fk_model_id");

-- CreateIndex
CREATE INDEX "nc_columns_v2_oldpk_idx" ON "nc_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_comment_reactions_base_id_fk_workspace_id_index" ON "nc_comment_reactions"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_comment_reactions_comment_id_index" ON "nc_comment_reactions"("comment_id");

-- CreateIndex
CREATE INDEX "nc_comment_reactions_oldpk_idx" ON "nc_comment_reactions"("id");

-- CreateIndex
CREATE INDEX "nc_comment_reactions_row_id_index" ON "nc_comment_reactions"("row_id");

-- CreateIndex
CREATE INDEX "nc_comments_base_id_fk_workspace_id_index" ON "nc_comments"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_comments_oldpk_idx" ON "nc_comments"("id");

-- CreateIndex
CREATE INDEX "nc_comments_row_id_fk_model_id_index" ON "nc_comments"("row_id", "fk_model_id");

-- CreateIndex
CREATE INDEX "nc_custom_urls_context" ON "nc_custom_urls_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_custom_urls_v2_custom_path_index" ON "nc_custom_urls_v2"("custom_path");

-- CreateIndex
CREATE INDEX "nc_custom_urls_v2_fk_dashboard_id_index" ON "nc_custom_urls_v2"("fk_dashboard_id");

-- CreateIndex
CREATE INDEX "nc_custom_urls_v2_oldpk_idx" ON "nc_custom_urls_v2"("id");

-- CreateIndex
CREATE INDEX "nc_dashboards_context" ON "nc_dashboards_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_dashboards_v2_oldpk_idx" ON "nc_dashboards_v2"("id");

-- CreateIndex
CREATE INDEX "share_uuid_idx" ON "nc_dashboards_v2"("uuid");

-- CreateIndex
CREATE INDEX "nc_data_reflection_fk_workspace_id_index" ON "nc_data_reflection"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_context_idx" ON "nc_dependency_tracker"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_dependent_idx" ON "nc_dependency_tracker"("dependent_type", "dependent_id");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_oldpk_idx" ON "nc_dependency_tracker"("id");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_queryable_field_0_idx" ON "nc_dependency_tracker"("queryable_field_0");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_queryable_field_1_idx" ON "nc_dependency_tracker"("queryable_field_1");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_queryable_field_2_idx" ON "nc_dependency_tracker"("queryable_field_2");

-- CreateIndex
CREATE INDEX "nc_dependency_tracker_source_idx" ON "nc_dependency_tracker"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "nc_disabled_models_for_role_v2_base_id_fk_workspace_id_index" ON "nc_disabled_models_for_role_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_disabled_models_for_role_v2_fk_view_id_index" ON "nc_disabled_models_for_role_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_disabled_models_for_role_v2_oldpk_idx" ON "nc_disabled_models_for_role_v2"("id");

-- CreateIndex
CREATE INDEX "nc_extensions_base_id_fk_workspace_id_index" ON "nc_extensions"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_extensions_oldpk_idx" ON "nc_extensions"("id");

-- CreateIndex
CREATE INDEX "nc_fr_context" ON "nc_file_references"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_rls_policy_idx" ON "nc_filter_exp_v2"("fk_rls_policy_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_base_id_fk_workspace_id_index" ON "nc_filter_exp_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_button_col_id_index" ON "nc_filter_exp_v2"("fk_button_col_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_column_id_index" ON "nc_filter_exp_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_hook_id_index" ON "nc_filter_exp_v2"("fk_hook_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_level_id_index" ON "nc_filter_exp_v2"("fk_level_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_link_col_id_index" ON "nc_filter_exp_v2"("fk_link_col_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_parent_column_id_index" ON "nc_filter_exp_v2"("fk_parent_column_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_parent_id_index" ON "nc_filter_exp_v2"("fk_parent_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_value_col_id_index" ON "nc_filter_exp_v2"("fk_value_col_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_view_id_index" ON "nc_filter_exp_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_fk_widget_id_index" ON "nc_filter_exp_v2"("fk_widget_id");

-- CreateIndex
CREATE INDEX "nc_filter_exp_v2_oldpk_idx" ON "nc_filter_exp_v2"("id");

-- CreateIndex
CREATE INDEX "nc_follower_fk_follower_id_index" ON "nc_follower"("fk_follower_id");

-- CreateIndex
CREATE INDEX "nc_follower_fk_user_id_index" ON "nc_follower"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_form_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_form_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_form_view_columns_v2_fk_column_id_index" ON "nc_form_view_columns_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_form_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_form_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_form_view_columns_v2_fk_view_id_index" ON "nc_form_view_columns_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_form_view_columns_v2_oldpk_idx" ON "nc_form_view_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_form_view_v2_base_id_fk_workspace_id_index" ON "nc_form_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_form_view_v2_fk_view_id_index" ON "nc_form_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_form_view_v2_oldpk_idx" ON "nc_form_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_gallery_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_columns_v2_fk_column_id_index" ON "nc_gallery_view_columns_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_gallery_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_columns_v2_fk_view_id_index" ON "nc_gallery_view_columns_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_columns_v2_oldpk_idx" ON "nc_gallery_view_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_v2_base_id_fk_workspace_id_index" ON "nc_gallery_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_v2_fk_view_id_index" ON "nc_gallery_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_gallery_view_v2_oldpk_idx" ON "nc_gallery_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_grid_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_columns_v2_fk_column_id_index" ON "nc_grid_view_columns_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_grid_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_columns_v2_fk_view_id_index" ON "nc_grid_view_columns_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_columns_v2_oldpk_idx" ON "nc_grid_view_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_grid_view_v2_base_id_fk_workspace_id_index" ON "nc_grid_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_v2_fk_view_id_index" ON "nc_grid_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_grid_view_v2_oldpk_idx" ON "nc_grid_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_hook_logs_v2_base_id_fk_workspace_id_index" ON "nc_hook_logs_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_hook_logs_v2_oldpk_idx" ON "nc_hook_logs_v2"("id");

-- CreateIndex
CREATE INDEX "nc_hooks_v2_base_id_fk_workspace_id_index" ON "nc_hooks_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_hooks_v2_fk_model_id_index" ON "nc_hooks_v2"("fk_model_id");

-- CreateIndex
CREATE INDEX "nc_hooks_v2_oldpk_idx" ON "nc_hooks_v2"("id");

-- CreateIndex
CREATE INDEX "nc_installations_license_key_idx" ON "nc_installations"("license_key");

-- CreateIndex
CREATE INDEX "nc_integrations_store_v2_fk_integration_id_index" ON "nc_integrations_store_v2"("fk_integration_id");

-- CreateIndex
CREATE INDEX "nc_integrations_v2_created_by_index" ON "nc_integrations_v2"("created_by");

-- CreateIndex
CREATE INDEX "nc_integrations_v2_fk_workspace_id_index" ON "nc_integrations_v2"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_integrations_v2_type_index" ON "nc_integrations_v2"("type");

-- CreateIndex
CREATE INDEX "nc_jobs_context" ON "nc_jobs"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_kanban_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_columns_v2_fk_column_id_index" ON "nc_kanban_view_columns_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_kanban_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_columns_v2_fk_view_id_index" ON "nc_kanban_view_columns_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_columns_v2_oldpk_idx" ON "nc_kanban_view_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_v2_base_id_fk_workspace_id_index" ON "nc_kanban_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_v2_fk_grp_col_id_index" ON "nc_kanban_view_v2"("fk_grp_col_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_v2_fk_view_id_index" ON "nc_kanban_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_kanban_view_v2_oldpk_idx" ON "nc_kanban_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_list_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_list_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_columns_v2_fk_view_id_index" ON "nc_list_view_columns_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_levels_v2_base_id_fk_workspace_id_index" ON "nc_list_view_levels_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_levels_v2_fk_view_id_index" ON "nc_list_view_levels_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_v2_base_id_fk_workspace_id_index" ON "nc_list_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_outline_view_v2_fk_view_id_index" ON "nc_list_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_managed_app_deployment_logs_managed_app_id_idx" ON "nc_managed_app_deployment_logs"("fk_managed_app_id");

-- CreateIndex
CREATE INDEX "nc_sandbox_deployment_logs_base_created_idx" ON "nc_managed_app_deployment_logs"("base_id", "created_at");

-- CreateIndex
CREATE INDEX "nc_sandbox_deployment_logs_base_id_idx" ON "nc_managed_app_deployment_logs"("base_id");

-- CreateIndex
CREATE INDEX "nc_sandbox_deployment_logs_from_version_idx" ON "nc_managed_app_deployment_logs"("from_version_id");

-- CreateIndex
CREATE INDEX "nc_sandbox_deployment_logs_status_idx" ON "nc_managed_app_deployment_logs"("status");

-- CreateIndex
CREATE INDEX "nc_sandbox_deployment_logs_to_version_idx" ON "nc_managed_app_deployment_logs"("to_version_id");

-- CreateIndex
CREATE INDEX "nc_sandbox_deployment_logs_workspace_id_idx" ON "nc_managed_app_deployment_logs"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_managed_app_versions_managed_app_id_idx" ON "nc_managed_app_versions"("fk_managed_app_id");

-- CreateIndex
CREATE INDEX "nc_managed_app_versions_ordering_idx" ON "nc_managed_app_versions"("fk_managed_app_id", "version_number");

-- CreateIndex
CREATE INDEX "nc_managed_app_versions_status_idx" ON "nc_managed_app_versions"("fk_managed_app_id", "status");

-- CreateIndex
CREATE INDEX "nc_sandbox_versions_workspace_id_idx" ON "nc_managed_app_versions"("fk_workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "nc_managed_app_versions_number_unique_idx" ON "nc_managed_app_versions"("fk_managed_app_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "nc_managed_app_versions_unique_idx" ON "nc_managed_app_versions"("fk_managed_app_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "nc_sandboxes_base_id_unique" ON "nc_managed_apps"("base_id");

-- CreateIndex
CREATE INDEX "nc_sandboxes_base_id_idx" ON "nc_managed_apps"("base_id");

-- CreateIndex
CREATE INDEX "nc_sandboxes_category_idx" ON "nc_managed_apps"("category");

-- CreateIndex
CREATE INDEX "nc_sandboxes_created_by_idx" ON "nc_managed_apps"("created_by");

-- CreateIndex
CREATE INDEX "nc_sandboxes_deleted_idx" ON "nc_managed_apps"("deleted");

-- CreateIndex
CREATE INDEX "nc_sandboxes_visibility_idx" ON "nc_managed_apps"("visibility");

-- CreateIndex
CREATE INDEX "nc_sandboxes_workspace_id_idx" ON "nc_managed_apps"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_map_view_columns_v2_base_id_fk_workspace_id_index" ON "nc_map_view_columns_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_map_view_columns_v2_fk_column_id_index" ON "nc_map_view_columns_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_map_view_columns_v2_fk_view_id_fk_column_id_index" ON "nc_map_view_columns_v2"("fk_view_id", "fk_column_id");

-- CreateIndex
CREATE INDEX "nc_map_view_columns_v2_fk_view_id_index" ON "nc_map_view_columns_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_map_view_columns_v2_oldpk_idx" ON "nc_map_view_columns_v2"("id");

-- CreateIndex
CREATE INDEX "nc_map_view_v2_base_id_fk_workspace_id_index" ON "nc_map_view_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_map_view_v2_fk_geo_data_col_id_index" ON "nc_map_view_v2"("fk_geo_data_col_id");

-- CreateIndex
CREATE INDEX "nc_map_view_v2_fk_view_id_index" ON "nc_map_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_map_view_v2_oldpk_idx" ON "nc_map_view_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_mc_tokens_context" ON "nc_mcp_tokens"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_mcp_tokens_oldpk_idx" ON "nc_mcp_tokens"("id");

-- CreateIndex
CREATE INDEX "nc_model_stats_v2_base_id_fk_workspace_id_index" ON "nc_model_stats_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_model_stats_v2_fk_workspace_id_index" ON "nc_model_stats_v2"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_model_stats_v2_oldpk_idx" ON "nc_model_stats_v2"("fk_workspace_id", "fk_model_id");

-- CreateIndex
CREATE INDEX "nc_models_v2_base_id_fk_workspace_id_index" ON "nc_models_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_models_v2_oldpk_idx" ON "nc_models_v2"("id");

-- CreateIndex
CREATE INDEX "nc_models_v2_source_id_index" ON "nc_models_v2"("source_id");

-- CreateIndex
CREATE INDEX "nc_models_v2_type_index" ON "nc_models_v2"("type");

-- CreateIndex
CREATE INDEX "nc_models_v2_uuid_index" ON "nc_models_v2"("uuid");

-- CreateIndex
CREATE INDEX "nc_oauth_authorization_codes_code_index" ON "nc_oauth_authorization_codes"("code");

-- CreateIndex
CREATE INDEX "nc_oauth_authorization_codes_expires_at_index" ON "nc_oauth_authorization_codes"("expires_at");

-- CreateIndex
CREATE INDEX "nc_oauth_authorization_codes_fk_client_id_fk_user_id_index" ON "nc_oauth_authorization_codes"("fk_client_id", "fk_user_id");

-- CreateIndex
CREATE INDEX "nc_oauth_authorization_codes_fk_client_id_index" ON "nc_oauth_authorization_codes"("fk_client_id");

-- CreateIndex
CREATE INDEX "nc_oauth_authorization_codes_fk_user_id_index" ON "nc_oauth_authorization_codes"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_oauth_authorization_codes_is_used_index" ON "nc_oauth_authorization_codes"("is_used");

-- CreateIndex
CREATE INDEX "nc_oauth_clients_fk_user_id_index" ON "nc_oauth_clients"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_access_token_expires_at_index" ON "nc_oauth_tokens"("access_token_expires_at");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_access_token_index" ON "nc_oauth_tokens"("access_token");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_fk_client_id_fk_user_id_index" ON "nc_oauth_tokens"("fk_client_id", "fk_user_id");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_fk_client_id_index" ON "nc_oauth_tokens"("fk_client_id");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_fk_user_id_index" ON "nc_oauth_tokens"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_is_revoked_access_token_expires_at_index" ON "nc_oauth_tokens"("is_revoked", "access_token_expires_at");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_is_revoked_index" ON "nc_oauth_tokens"("is_revoked");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_last_used_at_index" ON "nc_oauth_tokens"("last_used_at");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_refresh_token_expires_at_index" ON "nc_oauth_tokens"("refresh_token_expires_at");

-- CreateIndex
CREATE INDEX "nc_oauth_tokens_refresh_token_index" ON "nc_oauth_tokens"("refresh_token");

-- CreateIndex
CREATE INDEX "nc_org_fk_user_id_index" ON "nc_org"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_org_slug_index" ON "nc_org"("slug");

-- CreateIndex
CREATE INDEX "nc_org_domain_domain_index" ON "nc_org_domain"("domain");

-- CreateIndex
CREATE INDEX "nc_org_domain_fk_org_id_index" ON "nc_org_domain"("fk_org_id");

-- CreateIndex
CREATE INDEX "nc_org_domain_fk_user_id_index" ON "nc_org_domain"("fk_user_id");

-- CreateIndex
CREATE INDEX "org_domain_fk_workspace_id_idx" ON "nc_org_domain"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_permission_subjects_context" ON "nc_permission_subjects"("fk_workspace_id", "base_id");

-- CreateIndex
CREATE INDEX "nc_permission_subjects_oldpk_idx" ON "nc_permission_subjects"("fk_permission_id", "subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "nc_permissions_context" ON "nc_permissions"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_permissions_entity" ON "nc_permissions"("entity", "entity_id", "permission");

-- CreateIndex
CREATE INDEX "nc_permissions_oldpk_idx" ON "nc_permissions"("id");

-- CreateIndex
CREATE INDEX "nc_plans_stripe_product_idx" ON "nc_plans"("stripe_product_id");

-- CreateIndex
CREATE INDEX "nc_principal_assignments_principal_idx" ON "nc_principal_assignments"("principal_type", "principal_ref_id");

-- CreateIndex
CREATE INDEX "nc_principal_assignments_principal_resource_idx" ON "nc_principal_assignments"("principal_type", "principal_ref_id", "resource_type");

-- CreateIndex
CREATE INDEX "nc_principal_assignments_resource_idx" ON "nc_principal_assignments"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "nc_principal_assignments_resource_principal_type_idx" ON "nc_principal_assignments"("resource_type", "resource_id", "principal_type");

-- CreateIndex
CREATE INDEX "nc_record_templates_base_id_index" ON "nc_record_templates"("base_id");

-- CreateIndex
CREATE INDEX "nc_record_templates_fk_model_id_index" ON "nc_record_templates"("fk_model_id");

-- CreateIndex
CREATE INDEX "nc_record_templates_fk_workspace_id_index" ON "nc_record_templates"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_rls_policies_model_default_idx" ON "nc_rls_policies"("fk_model_id", "is_default");

-- CreateIndex
CREATE INDEX "nc_rls_policies_model_enabled_idx" ON "nc_rls_policies"("fk_model_id", "enabled");

-- CreateIndex
CREATE INDEX "nc_rls_policy_subjects_context_idx" ON "nc_rls_policy_subjects"("fk_workspace_id", "base_id");

-- CreateIndex
CREATE INDEX "nc_row_color_conditions_fk_view_id_index" ON "nc_row_color_conditions"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_row_color_conditions_fk_workspace_id_base_id_index" ON "nc_row_color_conditions"("fk_workspace_id", "base_id");

-- CreateIndex
CREATE INDEX "nc_row_color_conditions_oldpk_idx" ON "nc_row_color_conditions"("id");

-- CreateIndex
CREATE INDEX "nc_sandboxes_v2_created_by_idx" ON "nc_sandboxes_v2"("created_by");

-- CreateIndex
CREATE INDEX "nc_sandboxes_v2_master_base_id_idx" ON "nc_sandboxes_v2"("master_base_id");

-- CreateIndex
CREATE INDEX "nc_sandboxes_v2_sandbox_base_id_idx" ON "nc_sandboxes_v2"("sandbox_base_id");

-- CreateIndex
CREATE INDEX "nc_sandboxes_v2_workspace_id_idx" ON "nc_sandboxes_v2"("fk_workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "nc_scim_config_fk_workspace_id_unique" ON "nc_scim_config"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_scim_config_workspace_idx" ON "nc_scim_config"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_scripts_context" ON "nc_scripts"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_scripts_oldpk_idx" ON "nc_scripts"("id");

-- CreateIndex
CREATE INDEX "nc_snapshot_context" ON "nc_snapshots"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sort_v2_base_id_fk_workspace_id_index" ON "nc_sort_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sort_v2_fk_column_id_index" ON "nc_sort_v2"("fk_column_id");

-- CreateIndex
CREATE INDEX "nc_sort_v2_fk_level_id_index" ON "nc_sort_v2"("fk_level_id");

-- CreateIndex
CREATE INDEX "nc_sort_v2_fk_view_id_index" ON "nc_sort_v2"("fk_view_id");

-- CreateIndex
CREATE INDEX "nc_sort_v2_oldpk_idx" ON "nc_sort_v2"("id");

-- CreateIndex
CREATE INDEX "nc_source_v2_base_id_fk_workspace_id_index" ON "nc_sources_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_source_v2_fk_integration_id_index" ON "nc_sources_v2"("fk_integration_id");

-- CreateIndex
CREATE INDEX "nc_source_v2_fk_sql_executor_id_index" ON "nc_sources_v2"("fk_sql_executor_id");

-- CreateIndex
CREATE INDEX "nc_sources_v2_oldpk_idx" ON "nc_sources_v2"("id");

-- CreateIndex
CREATE INDEX "nc_sso_client_domain_name_index" ON "nc_sso_client"("domain_name");

-- CreateIndex
CREATE INDEX "nc_sso_client_fk_user_id_index" ON "nc_sso_client"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_sso_client_fk_workspace_id_index" ON "nc_sso_client"("fk_org_id");

-- CreateIndex
CREATE INDEX "sso_client_fk_workspace_id_idx" ON "nc_sso_client"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_store_key_index" ON "nc_store"("key");

-- CreateIndex
CREATE INDEX "nc_subscriptions_org_idx" ON "nc_subscriptions"("fk_org_id");

-- CreateIndex
CREATE INDEX "nc_subscriptions_stripe_subscription_idx" ON "nc_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "nc_subscriptions_ws_idx" ON "nc_subscriptions"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sync_configs_context" ON "nc_sync_configs"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sync_configs_oldpk_idx" ON "nc_sync_configs"("id");

-- CreateIndex
CREATE INDEX "nc_sync_configs_parent_idx" ON "nc_sync_configs"("fk_parent_sync_config_id");

-- CreateIndex
CREATE INDEX "sync_configs_integration_model" ON "nc_sync_configs"("fk_model_id", "fk_integration_id");

-- CreateIndex
CREATE INDEX "nc_sync_logs_v2_base_id_fk_workspace_id_index" ON "nc_sync_logs_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sync_logs_v2_oldpk_idx" ON "nc_sync_logs_v2"("id");

-- CreateIndex
CREATE INDEX "nc_sync_mappings_context" ON "nc_sync_mappings"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sync_mappings_oldpk_idx" ON "nc_sync_mappings"("id");

-- CreateIndex
CREATE INDEX "nc_sync_mappings_sync_config_idx" ON "nc_sync_mappings"("fk_sync_config_id");

-- CreateIndex
CREATE INDEX "nc_sync_source_v2_base_id_fk_workspace_id_index" ON "nc_sync_source_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_sync_source_v2_oldpk_idx" ON "nc_sync_source_v2"("id");

-- CreateIndex
CREATE INDEX "nc_sync_source_v2_source_id_index" ON "nc_sync_source_v2"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "nc_teams_scim_external_id_unique" ON "nc_teams"("scim_external_id");

-- CreateIndex
CREATE INDEX "nc_teams_created_by_idx" ON "nc_teams"("created_by");

-- CreateIndex
CREATE INDEX "nc_teams_org_idx" ON "nc_teams"("fk_org_id");

-- CreateIndex
CREATE INDEX "nc_teams_scim_external_id_idx" ON "nc_teams"("scim_external_id");

-- CreateIndex
CREATE INDEX "nc_teams_scim_managed_idx" ON "nc_teams"("scim_managed");

-- CreateIndex
CREATE INDEX "nc_teams_workspace_idx" ON "nc_teams"("fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_usage_stats_ws_period_idx" ON "nc_usage_stats"("fk_workspace_id", "period_start");

-- CreateIndex
CREATE INDEX "nc_user_comment_notifications_preference_base_id_fk_workspace_i" ON "nc_user_comment_notifications_preference"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "user_comments_preference_index" ON "nc_user_comment_notifications_preference"("user_id", "row_id", "fk_model_id");

-- CreateIndex
CREATE INDEX "nc_user_refresh_tokens_expires_at_index" ON "nc_user_refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "nc_user_refresh_tokens_fk_user_id_index" ON "nc_user_refresh_tokens"("fk_user_id");

-- CreateIndex
CREATE INDEX "nc_user_refresh_tokens_token_index" ON "nc_user_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "nc_users_v2_canonical_email_index" ON "nc_users_v2"("canonical_email");

-- CreateIndex
CREATE INDEX "nc_users_v2_email_index" ON "nc_users_v2"("email");

-- CreateIndex
CREATE INDEX "nc_view_sections_context" ON "nc_view_sections"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_view_sections_model_idx" ON "nc_view_sections"("fk_model_id");

-- CreateIndex
CREATE INDEX "nc_views_v2_base_id_fk_workspace_id_index" ON "nc_views_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_views_v2_created_by_index" ON "nc_views_v2"("created_by");

-- CreateIndex
CREATE INDEX "nc_views_v2_fk_custom_url_id_index" ON "nc_views_v2"("fk_custom_url_id");

-- CreateIndex
CREATE INDEX "nc_views_v2_fk_model_id_index" ON "nc_views_v2"("fk_model_id");

-- CreateIndex
CREATE INDEX "nc_views_v2_oldpk_idx" ON "nc_views_v2"("id");

-- CreateIndex
CREATE INDEX "nc_views_v2_owned_by_index" ON "nc_views_v2"("owned_by");

-- CreateIndex
CREATE INDEX "nc_widgets_context" ON "nc_widgets_v2"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "nc_widgets_dashboard_idx" ON "nc_widgets_v2"("fk_dashboard_id");

-- CreateIndex
CREATE INDEX "nc_widgets_v2_oldpk_idx" ON "nc_widgets_v2"("id");

-- CreateIndex
CREATE INDEX "nc_workflows_context_idx" ON "nc_workflows"("base_id", "fk_workspace_id");

-- CreateIndex
CREATE INDEX "notification_created_at_index" ON "notification"("created_at");

-- CreateIndex
CREATE INDEX "notification_fk_user_id_index" ON "notification"("fk_user_id");

-- CreateIndex
CREATE INDEX "workspace_fk_org_id_index" ON "workspace"("fk_org_id");

-- CreateIndex
CREATE INDEX "nc_workspace_user_scim_external_id_idx" ON "workspace_user"("scim_external_id");

-- CreateIndex
CREATE INDEX "nc_workspace_user_scim_managed_idx" ON "workspace_user"("scim_managed");

-- CreateIndex
CREATE INDEX "workspace_user_invited_by_index" ON "workspace_user"("invited_by");

-- CreateIndex
CREATE UNIQUE INDEX "PanelUser_email_key" ON "PanelUser"("email");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chatwoot" ADD CONSTRAINT "Chatwoot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dify" ADD CONSTRAINT "Dify_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifySetting" ADD CONSTRAINT "DifySetting_difyIdFallback_fkey" FOREIGN KEY ("difyIdFallback") REFERENCES "Dify"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifySetting" ADD CONSTRAINT "DifySetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evoai" ADD CONSTRAINT "Evoai_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvoaiSetting" ADD CONSTRAINT "EvoaiSetting_evoaiIdFallback_fkey" FOREIGN KEY ("evoaiIdFallback") REFERENCES "Evoai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvoaiSetting" ADD CONSTRAINT "EvoaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionBot" ADD CONSTRAINT "EvolutionBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionBotSetting" ADD CONSTRAINT "EvolutionBotSetting_botIdFallback_fkey" FOREIGN KEY ("botIdFallback") REFERENCES "EvolutionBot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionBotSetting" ADD CONSTRAINT "EvolutionBotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flowise" ADD CONSTRAINT "Flowise_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowiseSetting" ADD CONSTRAINT "FlowiseSetting_flowiseIdFallback_fkey" FOREIGN KEY ("flowiseIdFallback") REFERENCES "Flowise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowiseSetting" ADD CONSTRAINT "FlowiseSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSession" ADD CONSTRAINT "IntegrationSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kafka" ADD CONSTRAINT "Kafka_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntegrationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageUpdate" ADD CONSTRAINT "MessageUpdate_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageUpdate" ADD CONSTRAINT "MessageUpdate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8n" ADD CONSTRAINT "N8n_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8nSetting" ADD CONSTRAINT "N8nSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8nSetting" ADD CONSTRAINT "N8nSetting_n8nIdFallback_fkey" FOREIGN KEY ("n8nIdFallback") REFERENCES "N8n"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nats" ADD CONSTRAINT "Nats_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiBot" ADD CONSTRAINT "OpenaiBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiBot" ADD CONSTRAINT "OpenaiBot_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "OpenaiCreds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiCreds" ADD CONSTRAINT "OpenaiCreds_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiSetting" ADD CONSTRAINT "OpenaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiSetting" ADD CONSTRAINT "OpenaiSetting_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "OpenaiCreds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiSetting" ADD CONSTRAINT "OpenaiSetting_openaiIdFallback_fkey" FOREIGN KEY ("openaiIdFallback") REFERENCES "OpenaiBot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proxy" ADD CONSTRAINT "Proxy_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pusher" ADD CONSTRAINT "Pusher_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbitmq" ADD CONSTRAINT "Rabbitmq_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sqs" ADD CONSTRAINT "Sqs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Typebot" ADD CONSTRAINT "Typebot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypebotSetting" ADD CONSTRAINT "TypebotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypebotSetting" ADD CONSTRAINT "TypebotSetting_typebotIdFallback_fkey" FOREIGN KEY ("typebotIdFallback") REFERENCES "Typebot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Websocket" ADD CONSTRAINT "Websocket_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
