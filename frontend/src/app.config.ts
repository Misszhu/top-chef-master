export default defineAppConfig({
  /** 仅 tab 页留在主包，避免真机调试主包超过 2MB（错误码 80051） */
  pages: ['pages/index/index', 'pages/profile/index'],
  subPackages: [
    {
      root: 'package-recipes',
      name: 'recipes',
      pages: ['pages/dish-detail/index', 'pages/add-dish/index', 'pages/edit-dish/index'],
    },
    {
      root: 'package-user',
      name: 'user',
      pages: ['pages/favorites/index', 'pages/user-profile/index', 'pages/user-list/index'],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '顶级主厨',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#ff9900',
    backgroundColor: '#fff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '发现',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
})
