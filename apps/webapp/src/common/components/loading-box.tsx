import { Container, Paper, Loader } from '@mantine/core';

const LoadingBox: React.FC = () => (
  <Container my="xl" size="sm">
    <Paper mih={300} display="flex" sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </Paper>
  </Container>
);

export default LoadingBox;
