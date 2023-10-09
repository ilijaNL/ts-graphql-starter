import { createAsyncAction } from '@/utils/actions';
import { Type } from '@sinclair/typebox';

export const createSendOTP = () =>
  createAsyncAction({
    schema: Type.Null(),
    async handler(input, ctx, props) {
      //       const token = randomUUID();
      //       const batcher = new QueryBatch();
      //       if ('email' in input) {
      //         batcher.addCompiled(
      //           qb
      //             .insertInto('otp')
      //             .values({
      //               type: 'email',
      //               value: input.email.toLowerCase().trim(),
      //               id: token,
      //             })
      //             .compile()
      //         );
      //       }
      //       if ('phone' in input) {
      //         batcher.addCompiled(
      //           qb
      //             .insertInto('otp')
      //             .values({
      //               type: 'phone',
      //               value: input.phone.toLowerCase(),
      //               id: token,
      //             })
      //             .compile()
      //         );
      //       }
      //       // create otp job
      //       // send
      //       await batcher.commit(props.pool);
    },
  });
