import request from '../utils/request';

export const login = async (code: string) => {
  const response = await request.post('/auth/login', { code });
  return response.data.data;
};

export const getProfile = async () => {
  const response = await request.get('/users/profile');
  return response.data.data;
};
