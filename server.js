'use strict';

const Hapi = require('@hapi/hapi');
const CatboxRedis = require('@hapi/catbox-redis');

const init = async () => {

  const server = Hapi.server({
    port: 8000,
    cache: [
      {
        name: 'catbox_cache_demo',
        provider: {
            constructor: CatboxRedis,
            options: {
                partition : 'cached_partition',
                host: '127.0.0.1',
                port: 6379,
                password: 'redis_password', // if seted password to Redis
            }
        }
      }
    ]
  });

  const add = async (a, b) => {
    return Number(a) + Number(b);
  };

  const sumCache = server.cache({
    cache: 'catbox_cache_demo',
    segment: 'cache_segment',
    expiresIn: 20 * 1000,
    generateFunc: async (id) => {
        return await add(id.a, id.b);
    },
    generateTimeout: 2000
  });

  server.route({
      path: '/add/{a}/{b}',
      method: 'GET',
      handler: async function (request, h) {

          const { a, b } = request.params;
          const id = `${a}:${b}`;

          return await sumCache.get({ id, a, b });
      }
  });

  await server.start();
    console.log('Server running on %s', server.info.uri);
  };

  process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();


//Result: "cached_partition:cache_segment:3%3A94"
