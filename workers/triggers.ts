export const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) => {
  switch (controller.cron) {
    case '*/5 * * * *':
      ctx.waitUntil(fetch(env.API_URL + '/openapi.json').then((res) => console.log(res)))
      break
  }
  console.log(JSON.stringify(controller, null, 2))
}
