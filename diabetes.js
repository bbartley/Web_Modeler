

// Demonstration script starts here
var S = Object.create(System);

S.addSpecies('Glucagon',1,null);
S.addSpecies('Insulin',1,null);
S.addSpecies('Glucose',1,null);
S.addSpecies('Fast-acting insulin_e', 0, null); //short-acting, exogeneous
S.addSpecies('Fast-acting insulin', 0, null); //short-acting
S.addSpecies('Long-acting insulin', 0, null); //long-acting, exogeneous
S.addSpecies('Long-acting insulin_e', 0, null); //long-acting

//S.addParameter('K', 4.1);
S.addParameter('K', 4.1);

S.addParameter('delta', .1, 'hormonal degradation rate');
S.addParameter('delta_s', 2, 'short-acting degradation rate');
S.addParameter('delta_l', .025, 'long-acting degradation rate');
S.addParameter('k_s', 0.6, 'short-acting absorption rate');
S.addParameter('k_l', 0.025, 'long-acting absorption rate');
S.addParameter('input', .01, 'glucose input from tissues');
S.addParameter('eta', .1, 'glucose output, ie, excretion');
S.addParameter('alpha', 1, 'glucagon sensitivity');
S.addParameter('beta', 1, 'insulin sensitivity');
S.addParameter('gamma', 1, 'beta cell mass');
S.addParameter('p_s', 0.5, 'short-acting potency');
S.addParameter('p_l', 0.25, 'long-acting potency');
//S.add_function('h', 'K - A - B')
S.defineInteraction('first order decay', ['a']);
S.interactions['first order decay'].rules['a'].set('-alpha * a');
S.addInteraction('first order decay', ['Glucagon'], ['delta']);
S.addInteraction('first order decay', ['Insulin'], ['delta']);
S.addInteraction('first order decay', ['Glucose'], ['eta']);
S.addInteraction('first order decay', ['Fast-acting insulin'], ['delta_s']);
S.addInteraction('first order decay', ['Long-acting insulin'], ['delta_l']);

	
S.defineInteraction('third-order agonist', ['a','b', 'g']);
S.interactions['third-order agonist'].rules['a'].set('a/g*(k-a-b)');
S.interactions['third-order agonist'].rules['g'].set('alpha*a');
S.addInteraction('third-order agonist', ['Glucagon', 'Insulin', 'Glucose'], ['K', 'alpha']);
	
S.defineInteraction('third-order antagonist', ['a','b', 'g']);
S.interactions['third-order antagonist'].rules['b'].set('u*a*g*(k-a-b)');
S.interactions['third-order antagonist'].rules['g'].set('-beta*b');
S.addInteraction('third-order antagonist', ['Glucagon', 'Insulin', 'Glucose'], ['gamma', 'K', 'beta']);
	

	
var foods = ['cake', 'grapes', 'pizza_slice', 'rice', 'steak'];
boluses = [.1, .01, .15, .03, .3];
boluses = [.3, .03, .45, .1, .9];
boluses = [2, .1, 1, 1.5, 0.5];

var GI_values = [1, 0.8, 0.5, 1, .1];
var GI_params = Array.apply(null, Array(GI_values.length)).map(function (_, i) { return 'GI' + i; });

S.defineInteraction('bolus absorption', ['g', 'i']);
S.interactions['bolus absorption'].rules['g'].set('gi*i');
S.interactions['bolus absorption'].rules['i'].set('-gi*i');
for (i_bolus in boluses) {
    S.addSpecies(foods[i_bolus], 0, null);
    S.addParameter(GI_params[i_bolus], GI_values[i_bolus]);
    S.addInteraction('bolus absorption', ['Glucose', foods[i_bolus]], [GI_params[i_bolus]]);
}
S.defineInteraction('basal glucose production', ['g']);
S.interactions['basal glucose production'].rules['g'].set('g_in');
S.addInteraction('basal glucose production', ['Glucose'], ['input']);

//S.defineInteraction('first order insulin absorption', ['b']);
//S.interactions['first order insulin absorption'].rules['b'].set('k * b');
//S.addInteraction('first order insulin absorption', ['Fast-acting insulin'], ['delta_s']);
//S.addInteraction('first order insulin absorption', ['Long-acting insulin'], ['delta_l']);

S.addInteraction('bolus absorption', ['Fast-acting insulin', 'Fast-acting insulin_e'], ['k_s']);
S.addInteraction('bolus absorption', ['Long-acting insulin', 'Long-acting insulin_e'], ['k_l']);
S.defineInteraction('exogenous insulin', ['g', 'b']);
S.interactions['exogenous insulin'].rules['g'].set('-k*b');
S.interactions['exogenous insulin'].rules['b'].set('0');
S.addInteraction('exogenous insulin', ['Glucose', 'Fast-acting insulin'], ['p_s']);
S.addInteraction('exogenous insulin', ['Glucose', 'Long-acting insulin'], ['p_l']);

S.compile();
console.log(S.species['Glucose'].rate_law.expression.toString());


C = new Config();
S.compile();
console.log(S.model);

Plots[0] = {
    DOM_element: 'plot_1',
    species: ['Glucose'],
    plot_config: {
        grid: {
            borderWidth: 1,
            minBorderMargin: 20,
            labelMargin: 10,
            backgroundColor: {
                colors: ["#fff", "#e4f4f4"]
            },
        },
        margin: {
            top: 8,
            bottom: 2,
            left: 20
        },
        series: {
            shadowSize: 0,	// Drawing is faster without shadows
        },
        yaxis: {
            min: 0,
            max: 5
        },
        xaxis: {
            ticks: false,
            min: 0,
            max: 2.5
        },
        colors: ['red']
    }
}
Plots[1] = {
    DOM_element: 'plot_2',
    species: ['Glucagon', 'Insulin'],
    plot_config: {
        grid: {
            borderWidth: 1,
            minBorderMargin: 20,
            labelMargin: 10,
            backgroundColor: {
                colors: ["#fff", "#e4f4f4"]
            },
        },
        margin: {
            top: 2,
            bottom: 20,
            left: 20
        },
        series: {
            shadowSize: 0,	// Drawing is faster without shadows
        },
        yaxis: {
            min: 0,
            max: 5
        },
        xaxis: {
            ticks: false
        }
    }
}
Plots[2] = {
    DOM_element: 'plot_3',
    species: ['Fast-acting insulin', 'Long-acting insulin'],
    plot_config: {
        grid: {
            borderWidth: 1,
            minBorderMargin: 20,
            labelMargin: 10,
            backgroundColor: {
                colors: ["#fff", "#e4f4f4"]
            },
        },
        margin: {
            top: 2,
            bottom: 20,
            left: 20
        },
        series: {
            shadowSize: 0,	// Drawing is faster without shadows
        },
        yaxis: {
            min: 0,
            max: 50
        },
        xaxis: {
            min: 0,
            max: 0,
            tickLength: 0
        }
    }
}

var rt = S.simulate_in_real_time(Plots, C);

var button_elements = $();
button_data = [];
for (var i_food in foods) {
    var i = button_data.push({
        bolus_type: foods[i_food],
        bolus_size: boluses[i_food],
        gi: GI_values[i_food]
    });
    console.log($('#' + foods[i_food]));
    button_elements = button_elements.add($('#' + foods[i_food]));
}
$.map(button_elements, function (element, i_element) {
    var element_id = $(element).attr('id');
    $(element).click(button_data[i_element], function (event) {
        clearInterval(rt.real_time_simulation);
        var len = rt.time.length;
        rt.trajectory[event.data.bolus_type][len - 1] = rt.trajectory[event.data.bolus_type][len - 1] + event.data.bolus_size;
        rt.real_time_simulation = setInterval(function () {
            rt.update_state(S, S.config, Plots);
        }, S.config.refresh_rate);
    });
});


$("#pause").click(function () {
    //clearInterval(rt);
    clearInterval(rt.real_time_simulation);
});

$("#play").click(function () {
    rt.real_time_simulation = setInterval(function () {
        rt.update_state(S, S.config, Plots);
    }, S.config.refresh_rate);
});

$("#slider_1").slider({
    change: function (event, ui) {
        var old_value = S.parameters['gamma'].value;
        var new_value = 0.1 + 0.9 * ui.value / 100
        S.parameters['gamma'].set(new_value);
    }
});

$("#slider_2").slider({
    change: function (event, ui) {
        var old_value = S.parameters['beta'].value;
        var new_value = 1 -  0.99 * ui.value / 100 
        S.parameters['beta'].set(new_value);
    }
});


$("#novolog").click(function (event) {
    insulin_units = $("#novolog_spinner").spinner("value");
    clearInterval(rt.real_time_simulation);
    var len = rt.time.length;
    rt.trajectory['Fast-acting insulin_e'][len - 1] = rt.trajectory['Fast-acting insulin_e'][len - 1] + insulin_units;
    rt.real_time_simulation = setInterval(function () {
        rt.update_state(S, S.config, Plots);
    }, S.config.refresh_rate);
});

$("#glargine").click(function () {
    insulin_units = $("#glargine_spinner").spinner("value");
    clearInterval(rt.real_time_simulation);
    var len = rt.time.length;
    rt.trajectory['Long-acting insulin_e'][len - 1] = rt.trajectory['Long-acting insulin_e'][len - 1] + insulin_units;
    rt.real_time_simulation = setInterval(function () {
        rt.update_state(S, S.config, Plots);
    }, S.config.refresh_rate);
});

//$('#slider').slider().bind('slidechange',function(event,ui){
//    S.parameters['beta'].set($("#slider_1").slider("value"));
//    console.log($("#slider_1").slider("value"), S.parameters['beta']);
// });


//$("#slider_1").slider({

//    slide: function (event, ui) {
//        S.parameters['beta'].set($("#slider_1").slider("value"));
//        console.log($("#slider_1").slider("value"), S.parameters['beta']);
//    }
//});