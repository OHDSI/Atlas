define(
  (require, factory) => {
		const minChartHeight = 300;
		const treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		const defaultDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
		
    return {
			minChartHeight,
			treemapGradient,
			defaultDeciles,
    };
  }
);