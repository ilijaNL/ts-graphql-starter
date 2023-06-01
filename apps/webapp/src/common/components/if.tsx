import { PropsWithChildren } from 'react';

const If = <Value,>(props: { value: Value; render: (value: NonNullable<Value>) => React.ReactElement }) => {
  if (props.value !== null && props.value !== undefined) {
    return props.render(props.value);
  }

  return null;
};

const Falsy = <Value,>(props: PropsWithChildren<{ value: Value }>) => {
  if (!props.value) {
    return <>{props.children}</>;
  }

  return null;
};

If.Falsy = Falsy;

export default If;
