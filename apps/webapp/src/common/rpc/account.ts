import { createRPCExecute } from '@/common/rpc/execute';
import getEnv from '@/config';
import { createAuthHooks } from '@/common/auth';
import { account } from '@ts-hasura-starter/api';

export const accountContract = account.contract;
export const accountExecuteFn = createRPCExecute(accountContract, getEnv('API') + '/auth/account');
export const accountHooks = createAuthHooks(accountExecuteFn);
