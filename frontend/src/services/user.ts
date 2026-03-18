import request from '../utils/request';

export const login = async (code: string) => {
  const response = await request.post('/users/login', { code });
  return response.data;
};

export const getProfile = async () => {
  const response = await request.get('/users/profile');
  return response.data;
};
