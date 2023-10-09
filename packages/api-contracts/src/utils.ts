import { TSchema, Type } from 'typed-client';

export const Nullable = <T extends TSchema>(type: T) => Type.Union([type, Type.Null()]);
export const Uuid = Type.String({ format: 'uuid' });

export const Success = Type.Object({
  ok: Type.Boolean(),
});

export const UploadData = Type.Object({
  signed_data: Type.Object({
    url: Type.String({ minLength: 1 }),
    fields: Type.Record(Type.String(), Type.Any()),
  }),
  relative_path: Type.String({ minLength: 1 }),
  path_sig: Type.String({ minLength: 1 }),
  resource_id: Type.String({}),
});

export const FileUploadData = Type.Object({
  sig: Type.String({ minLength: 1 }),
  path: Type.String({ minLength: 1 }),
});

export const ImageContentType = Type.Union([
  Type.Literal('image/png'),
  Type.Literal('image/gif'),
  Type.Literal('image/jpeg'),
  Type.Literal('image/webp'),
  Type.Literal('image/avif'),
]);

export const ImageExtension = Type.Union([
  Type.Literal('png'),
  Type.Literal('gif'),
  Type.Literal('jpg'),
  Type.Literal('jpeg'),
  Type.Literal('webp'),
  Type.Literal('avif'),
]);
