define(['./routes'],
  (buildRoutes) => {
    return {
      title: 'Concept Sets',
      buildRoutes,
      navUrl: () => '#/conceptsets',
      icon: 'shopping-cart',
			statusCss: () => ''
    };
  }
);