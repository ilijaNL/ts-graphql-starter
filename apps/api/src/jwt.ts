import { createVerifier } from 'fast-jwt';
import { FastifyRequest } from 'fastify';
import ENVS from './env';

export const ISS = 'auth';
const verifyJwt = createVerifier({ cache: true, key: ENVS.ACCESS_TOKEN_SECRET, allowedIss: [ISS] });

export type AccessToken = {
  acc_id: string;
  sub: string;
} & Record<string, unknown>;

export function getUserAuthFromRequest(request: FastifyRequest): AccessToken | null {
  try {
    const verifiedToken = verifyJwt((request.headers.authorization ?? '').replace('Bearer ', '')) as AccessToken;
    return verifiedToken;
  } catch (e) {
    return null;
  }
}
