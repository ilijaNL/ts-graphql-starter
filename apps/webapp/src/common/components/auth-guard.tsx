import Redirect from './redirect';
import { PropsWithChildren } from 'react';
import { useSession } from '@/common/session';
import LoadingBox from './loading-box';

type AuthGuardProps = {
  LoadingComp?: JSX.Element;
  redirectTo: string;
};

const AuthGuard: React.FC<PropsWithChildren<AuthGuardProps>> = ({
  redirectTo,
  LoadingComp = <LoadingBox />,
  children,
}) => {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return LoadingComp;
  }

  if (!isLoading && !user) {
    return <Redirect redirectTo={redirectTo} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
