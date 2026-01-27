import { configure, getConsoleSink, getJsonLinesFormatter, getLogger } from '@logtape/logtape';

await configure({
  sinks: {
    console: getConsoleSink({ formatter: getJsonLinesFormatter() }),
  },
  loggers: [
    { category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'warning' },
    {
      category: ['app'],
      sinks: ['console'],
      lowestLevel: 'debug',
    },
  ],
});

export const logger = getLogger(['app']);
