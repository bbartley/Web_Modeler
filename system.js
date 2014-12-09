// Class definition for System
// Requires math.js
function Species(initial_value, name) {
	this.value = initial_value;
	this.rate_laws = [];
	this.name = name;
	}

// Rule contains a mathematical expression describing how a species' rate law will change 
// when an instance of a parent Interaction is added to a System
function Rule() {
	this.name = null; // A name or description for this rule, eg, "Exponential Growth"
	this.expression = null; // A mathjs node at the root of the syntax tree
	
	// Parses expression into a syntax tree, and gives name to the rule
	this.set = function(expression, name) {
		this.expression = math.parse(expression);
		this.name = name;
	}
	this.toString = function() {
		console.log(this.expression.toString());
		}
	}

function Parameter(value, name) {
	this.value = value;
	this.name = name;
	}

// An Interaction describes what happens when the given 'species', whether molecular or ecological, 
// interact. The Interaction constructor also auto-constructs the child Rule objects 
// The given 'species' array also identifies variable names scoped inside the Rules objects
function Interaction(system, name, species) {
	this.name = name; // name or description for the interaction, eg "Predator-prey", see "giveName"
	this.system = system;  // parent system
	this.rules = {};  // array of objects containing mathematical definitions for an interaction
	//this.variables = [];  // variables parsed from rules and contained in this Interaction's local scope
	//this.parameters = []; // parameters parsed from rules and contained in this Interaction's local scope

	// @TODO use get variables() here, but doesn't seem to work inside a constructor function 
	this.variables = function() {
		return Object.keys(this.rules);
	}
	
	// Iterate through each child Rule and filter out all the Symbols.  Keep only nodes 
	// with parameters that aren't already in the array (if they were found in a previous Rule)
	// It's inefficient to identify Parameters in the Rule's local scope this way,
	// but given the small size of our Interactions in practice probably not a big deal
	// We might consider forcing the user to specify the parameters when the Rule is defined
	this.parameters = function() {
		var parameters = [];
		var p_nodes = [];
		var p_names = [];
		var variables = this.variables()
		for (r_id in this.rules) {
			p_nodes = this.rules[r_id].expression.filter(function (node) { 
				// return (node.type == 'SymbolNode' && 
						// !(node.name in variables) &&
						// !(node.name in parameters));
				return (node.type == 'SymbolNode' &&
						variables.indexOf(node.name) == -1 &&
						parameters.indexOf(node.name) == -1)
			});
			p_names = p_nodes.map(function(node) {
				return (node.name)
			});
			parameters = parameters.concat(p_names);
		}
		return parameters;
	}
	
	// Auto-construct a child Rule object for each species.
	// Then register it in this Interaction's scope using the variables field
	// This method is private and need not be called by the user
	this.addRule = function(variable) {
		this.rules[variable] = new Rule();
		}
		
	// Registers the new rule but doesn't initialize the expression or name
	for (var s_id in species) {
		//console.log(species[s_id]);
		this.addRule(species[s_id], null,  null);  
		}
}
	
var System = {
	species: [],
	rules: [],
	parameters: [],
	interactions: {},
	parser: math.parser(),
	addSpecies: function(identifier, initial_value, name) {
		this.species[identifier] = new Species(initial_value, name);
		this.parser.eval(identifier + '=' + initial_value);
	},
	addParameter: function(identifier, value, name) {
		this.parameters[identifier] = new Parameter(value, name);
		this.parser.eval(identifier + '=' + value);
	},
	
	
	// // Deprecated
	// addRule:  function(identifier, expression, name) {
		// this.rules[identifier] = new Rule(expression, name);
		// this.parser.eval(expression);
	// },

	defineInteraction:  function(name, species) {
		this.interactions[name] = new Interaction(this, name, species);
	},
		
	addInteraction: function(name, v_args, p_args) {
		// arguments array should contain as many Symbols as the expression tree
		var v_ids = this.interactions[name].variables();
		var p_ids = this.interactions[name].parameters();
		var symbol_table = [];
		
		//console.log(v_args, v_ids);
		//console.log(p_args, p_ids);
		
		// Validate that all arguments were passed to the Interaction
		if (v_args.length != v_ids.length) { return; }
		if (p_args.length != p_ids.length) { return; }
				
		// map variable arguments to variable symbols in expression tree
		// in order which rules were assigned
		for (var i_arg=0; i_arg < v_args.length; i_arg++) {
			symbol_table[v_ids[i_arg]] = v_args[i_arg];
			}

		// map parameter arguments to parameter symbols in expression tree
		// every symbol that's not already a member of rule_ids 
		for (var i_arg=0; i_arg < p_args.length; i_arg++) {
			symbol_table[p_ids[i_arg]] = p_args[i_arg];
			}
		console.log(symbol_table);
		
		// // map parameter arguments to parameter symbols in expression tree
		// // every symbol that's not already a member of rule_ids 
		// console.log(symbol_table);
		// console.log(name);
		// var i_p = 0;
		// for (var id in v_ids) {
			// console.log(id);
			// var expr_node = this.interactions[name].rules[id].expression;
			// expr_node.traverse(function (node, path, parent) {
				// if (node.type == 'SymbolNode' && !(node.name in symbol_table)) {
					// symbol_table[node.name] = p_args[i_p];
					// i_p++;
				// }
			// });
		// }
		// console.log(name);
		// console.log(this);
		
		//Substitute variable arguments and parameter arguments for variables and parameters in //Interaction's local scope
		console.log('Substituting Interaction arguments into Rule variables and parameters');
		for (var r_id in this.interactions[name].rules) {
			// 
			console.log('Rule:', r_id );
			this.interactions[name].rules[r_id].toString()

			// Filter SymbolNodes out of the syntax tree
			var nodes = this.interactions[name].rules[r_id].expression.filter(function (node) { 
				return (node.type == 'SymbolNode') 
			});
			
			for (i_n = 0; i_n < nodes.length; i_n++) {
				var node = nodes[i_n];
				console.log('Substituting:', i_n, nodes.length, nodes[i_n].type)
				// Look up the expression syntax node in the Interaction's local symbol table
				// then substitute in the argument symbol 
				if (Object.keys(symbol_table).indexOf(node.name) != -1) {
					console.log(node.name, symbol_table[node.name]);
					node.name = symbol_table[node.name];
				}
			}
			this.interactions[name].rules[r_id].toString();
		}
		// I tested mathjs library's transform function to replace nodes, but it didn't work
		//console.log(rule_id);
		//console.log(this.interactions[name].rules[rule_id].toString());
		//for (var rule_id in this.interactions[name].rules) {
			// expr_node = expr_node.transform(function (node, path, parent) {
				// if (node.type == 'SymbolNode') {
					// console.log(node.name, symbol_table[node.name]);
					//return node;  // didn't work
					//node.name = symbol_table[node.name];  // didn't work either
					// return new math.expression.node.SymbolNode(symbol_table[node.name]);
				// } else {
					// return node;
				// }
			// });
			//console.log( name);
			//this.interactions[name].rules[rule_id].expression = expr_node;
			//console.log(this.interactions[name]);
			//console.log(this.interactions[name].rules[rule_id].toString());
		//}
		
	}
	//simulate: function(){},
	//create_model: function() {}
}	

