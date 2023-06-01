import { TSchema, Type } from '@sinclair/typebox';

export const Nullable = <T extends TSchema>(type: T) => Type.Union([type, Type.Null()]);
export const Uuid = Type.String({ format: 'uuid' });

export const Success = Type.Object({
  ok: Type.Boolean(),
});

export const UploadData = Type.Object({
  signed_url: Type.String(),
  relative_path: Type.String(),
  resource_id: Type.String({}),
  headers: Type.Record(Type.String(), Type.Any()),
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
