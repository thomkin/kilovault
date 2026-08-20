import { Command } from 'commander';
import { init } from './generated/client';

const baseUrl = process.env.KILOVAULT_URL || 'http://localhost:5096';
let client = init({ baseUrl });

const program = new Command();

program
  .name('kilovault-cli')
  .description('CLI for kilovault secret management')
  .version('0.0.1');

// vault.get
program
  .command('get <key>')
  .description('Get secret value from vault')
  .option('-t, --token <token>', 'Auth token')
  .action(async (key, options) => {
    try {
      if (options.token) client.setToken(options.token);
      const res = await client.rpc.vault.get({ key });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(res.result?.value ?? '(not set)');
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

// vault.set
program
  .command('set <key> <value>')
  .description('Set secret value in vault')
  .option('-t, --token <token>', 'Auth token')
  .action(async (key, value, options) => {
    try {
      if (options.token) client.setToken(options.token);
      const res = await client.rpc.vault.set({ key, value });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(`✓ Set ${key}`);
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

// system.alive
program
  .command('status')
  .description('Check system status')
  .option('-t, --token <token>', 'Auth token')
  .action(async (options) => {
    try {
      if (options.token) client.setToken(options.token);
      const res = await client.rpc.system.alive({});
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      const ts = new Date(res.result?.timestamp || 0).toISOString();
      console.log(`✓ System alive at ${ts}`);
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });


// auth.getToken
program
  .command('auth <userId>')
  .description('Get authentication token')
  .requiredOption('-s, --secret <secret>', 'Auth secret')
  .option('-p, --permissions <json>', 'Permissions as JSON')
  .option('-e, --expires <seconds>', 'Token expiration in seconds')
  .action(async (userId, options) => {
    try {
      const permissions = options.permissions ? JSON.parse(options.permissions) : undefined;
      const expiresIn = options.expires ? parseInt(options.expires) : undefined;
      const res = await client.rpc.auth.getToken({
        secret: options.secret,
        userId,
        permissions,
        expiresIn,
      });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(res.result?.token);
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

// Admin commands
const admin = program.command('admin').description('Admin operations');

admin
  .command('list [userId]')
  .description('List all keys (optionally for specific user)')
  .requiredOption('-t, --token <token>', 'Admin token')
  .action(async (userId, options) => {
    try {
      client.setToken(options.token);
      const res = await client.rpc.vault.admin.list({ userId });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      if (!res.result?.keys.length) {
        console.log('{}');
        return;
      }

      if (userId) {
        const keys = res.result.keys.map(k => k.key);
        console.log(JSON.stringify({ [userId]: keys }, null, 2));
      } else {
        // Group by userId
        const grouped = res.result.keys.reduce(
          (acc, item) => {
            if (!acc[item.userId]) acc[item.userId] = [];
            acc[item.userId].push(item.key);
            return acc;
          },
          {} as Record<string, string[]>
        );
        console.log(JSON.stringify(grouped, null, 2));
      }
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

admin
  .command('get <userId> <key>')
  .description('Get key for any user')
  .requiredOption('-t, --token <token>', 'Admin token')
  .action(async (userId, key, options) => {
    try {
      client.setToken(options.token);
      const res = await client.rpc.vault.admin.get({ userId, key });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(res.result?.value ?? '(not set)');
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

admin
  .command('set <userId> <key> <value>')
  .description('Set key for any user')
  .requiredOption('-t, --token <token>', 'Admin token')
  .action(async (userId, key, value, options) => {
    try {
      client.setToken(options.token);
      const res = await client.rpc.vault.admin.set({ userId, key, value });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(`✓ Set ${key} for ${userId}`);
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

admin
  .command('delete <userId> <key>')
  .description('Delete key for any user')
  .requiredOption('-t, --token <token>', 'Admin token')
  .action(async (userId, key, options) => {
    try {
      client.setToken(options.token);
      const res = await client.rpc.vault.admin.delete({ userId, key });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(res.result?.deleted ? `✓ Deleted ${key} for ${userId}` : '(not found)');
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

admin
  .command('history [userId]')
  .description('Get vault history (optionally for specific user)')
  .requiredOption('-t, --token <token>', 'Admin token')
  .action(async (userId, options) => {
    try {
      client.setToken(options.token);
      const res = await client.rpc.history.get({ userId });
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      if (!res.result?.history.length) {
        console.log('No history');
        return;
      }
      console.table(res.result.history);
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

admin
  .command('cleanup')
  .description('Cleanup old history records')
  .requiredOption('-t, --token <token>', 'Admin token')
  .action(async (options) => {
    try {
      client.setToken(options.token);
      const res = await client.rpc.history.cleanup({});
      if (res.error) {
        console.error(`Error: ${res.error} - ${res.message}`);
        process.exit(1);
      }
      console.log(`✓ Cleaned up ${res.result?.count} records`);
    } catch (err) {
      console.error('Request failed:', err);
      process.exit(1);
    }
  });

program.parse();
