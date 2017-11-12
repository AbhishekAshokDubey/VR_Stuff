window.onload = function () {

	// dataPoints
	var dataPoints1 = [];
	var dataPoints2 = [];
	var dataPoints3 = [];

	var chart = new CanvasJS.Chart("chartContainer",{
		zoomEnabled: true,
		title: {
			text: "Sensor Health Signal"		
		},
		toolTip: {
			shared: true
			
		},
		legend: {
			verticalAlign: "top",
			horizontalAlign: "center",
							fontSize: 14,
			fontWeight: "bold",
			fontFamily: "calibri",
			fontColor: "dimGrey"
		},
		axisX: {
			title: "working normally"
		},
		axisY:{
			prefix: '~',
			includeZero: false
		}, 
		data: [{ 
			// dataSeries1
			type: "line",
			xValueType: "dateTime",
			showInLegend: true,
			name: "Predicted",
			dataPoints: dataPoints1
		},
		{				
			// dataSeries2
			type: "line",
			xValueType: "dateTime",
			showInLegend: true,
			name: "Actual" ,
			dataPoints: dataPoints2
		},
		{				
			// dataSeries2
			type: "line",
			xValueType: "dateTime",
			showInLegend: true,
			name: "delta" ,
			dataPoints: dataPoints3
		}],
	  legend:{
		cursor:"pointer",
		itemclick : function(e) {
		  if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
			e.dataSeries.visible = false;
		  }
		  else {
			e.dataSeries.visible = true;
		  }
		  chart.render();
		}
	  }
	});



	var updateInterval = 500;
	// initial value
	var yValue1 = 90; 
	var yValue2 = 80;

	var time = new Date();
/*	time.setHours(9);
	time.setMinutes(30);
	time.setSeconds(00);
	time.setMilliseconds(00);*/
	// starting at 9.30 am

	var updateChart = function (count) {
		count = count || 1;

		// count is number of times loop runs to generate random dataPoints. 

		for (var i = 0; i < count; i++) {
			
			// add interval duration to time				
			time.setTime(time.getTime()+ updateInterval);


			// generating random values
			var deltaY1 = .5 + Math.random() * -1.0;
			var deltaY2 = .5 + Math.random() * -1.0;

			// adding random value and rounding it to two digits. 
			yValue1 = Math.round((yValue1 + deltaY1)*100)/100;
			yValue2 = Math.round((yValue2 + deltaY2)*100)/100;
			
			// pushing the new values
			dataPoints1.push({
				x: time.getTime(),
				y: yValue1
			});
			dataPoints2.push({
				x: time.getTime(),
				y: yValue2
			});
			dataPoints3.push({
				x: time.getTime(),
				y: yValue1-yValue2
			});
		};

		// updating legend text with  updated with y Value 
		chart.options.data[0].legendText = "Predicted " + yValue1;
		chart.options.data[1].legendText = "Actual " + yValue2; 
		chart.options.data[2].legendText = "delta " + (yValue1-yValue2).toFixed(2).toString(); 
		chart.render();
	};

	// generates first set of dataPoints 
	updateChart(500);	
	// update chart after specified interval 
	setInterval(function(){updateChart()}, updateInterval);
	temp_credits = $("a.canvasjs-chart-credit");
	temp_credits.text("")
}