import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://6fdfb3f1e78f2dbb185a4ba6c4ad06fc@o4511294770511872.ingest.us.sentry.io/4511294980161536",
  tracesSampleRate: 0.1,
})
