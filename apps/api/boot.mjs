// Boot debug wrapper
console.log('[boot] node wrapper starting');
console.log('[boot] cwd=' + process.cwd());
console.log('[boot] PORT=' + process.env.PORT + ' API_PORT=' + process.env.API_PORT);
console.log('[boot] argv=' + JSON.stringify(process.argv));
console.log('[boot] NODE_ENV=' + process.env.NODE_ENV);

process.on('uncaughtException', (err) => {
  console.error('[boot] uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[boot] unhandledRejection:', err);
  process.exit(1);
});

try {
  console.log('[boot] importing tsx...');
  await import('tsx/esm/api');
  console.log('[boot] tsx loaded, calling run...');
  // Use tsx programmatically
  const { run } = await import('tsx/esm/api');
  run();
} catch (err) {
  console.error('[boot] failed to start:', err);
  process.exit(1);
}