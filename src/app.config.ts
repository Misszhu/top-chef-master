/**
 * Taro 应用配置
 */

const config = {
  pages: [
    'pages/home/index',
    'pages/dish-detail/index',
    'pages/add-dish/index',
    'pages/edit-dish/index',
    'pages/favorites/index',
    'pages/category/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '我的菜谱',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5',
    enablePullDownRefresh: true,
    onReachBottomDistance: 50,
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#ff6b35',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '菜肴',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png',
      },
      {
        pagePath: 'pages/favorites/index',
        text: '收藏',
        iconPath: 'assets/icons/star.png',
        selectedIconPath: 'assets/icons/star-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于获取周边餐厅信息',
    },
  },
};

export default config;
