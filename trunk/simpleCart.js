﻿/****************************************************************************
Copyright (c) 2011 The Wojo Group

thewojogroup.com
simplecartjs.com
http://github.com/thewojogroup/simplecart-js/tree/master

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/

var Custom="Custom",GoogleCheckout="GoogleCheckout",PayPal="PayPal",Email="Email",AustralianDollar="AUD",AUD="AUD",CanadianDollar="CAD",CAD="CAD",CzechKoruna="CZK",CZK="CZK",DanishKrone="DKK",DKK="DKK",Euro="EUR",EUR="EUR",HongKongDollar="HKD",HKD="HKD",HungarianForint="HUF",HUF="HUF",IsraeliNewSheqel="ILS",ILS="ILS",JapaneseYen="JPY",JPY="JPY",MexicanPeso="MXN",MXN="MXN",NorwegianKrone="NOK",NOK="NOK",NewZealandDollar="NZD",NZD="NZD",PolishZloty="PLN",PLN="PLN",PoundSterling="GBP",GBP="GBP",SingaporeDollar="SGD",SGD="SGD",SwedishKrona="SEK",SEK="SEK",SwissFranc="CHF",CHF="CHF",ThaiBaht="THB",THB="THB",USDollar="USD",USD="USD",VND="VND";
function Cart(){

	var me = this;
	/* member variables */
	me.nextId = 1;
	me.Version = '2.2';
	me.Shelf = null;
	me.items = {};
	me.isLoaded = false;
	me.pageIsReady = false;
	me.quantity = 0;
	me.total = 0;
	me.taxRate = 0;
	me.taxCost = 0;
	me.shippingFlatRate = 0;
	me.shippingTotalRate = 0;
	me.shippingQuantityRate = 0;
	me.shippingRate = 0;
	me.shippingCost = 0;
	me.currency = USD;
	me.checkoutTo = PayPal;
	me.email = "";
	me.merchantId	 = "";
	me.successUrl = null;
	me.cancelUrl = null;
	me.cookieDuration = 30; // default duration in days
	me.storagePrefix = "sc_";
	me.MAX_COOKIE_SIZE = 4000;
	me.cartHeaders = ['Tên hàng','Giá','Số lượng','Tổng cộng'];
	/*
		cart headers:
		you can set these to which ever order you would like, and the cart will display the appropriate headers
		and item info.	any field you have for the items in the cart can be used, and 'Total' will automatically
		be price*quantity.

		there are keywords that can be used:

			1) "_input" - the field will be a text input with the value set to the given field. when the user
				changes the value, it will update the cart.	 this can be useful for quantity. (ie "Quantity_input")

			2) "increment" - a link with "+" that will increase the item quantity by 1

			3) "decrement" - a link with "-" that will decrease the item quantity by 1

			4) "remove" - a link that will remove the item from the cart

			5) "_image" or "Image" - the field will be an img tag with the src set to the value. You can simply use "Image" if
				you set a field in the items called "Image".  If you have a field named something else, like "Thumb", you can add
				the "_image" to create the image tag (ie "Thumb_image").

			6) "_noHeader" - this will skip the header for that field (ie "increment_noHeader")


	*/




	/******************************************************
			add/remove items to cart
	 ******************************************************/

	me.add = function ( values ) {
		var me=this;
		/* load cart values if not already loaded */
		if( !me.pageIsReady		) {
			me.initializeView();
			me.update();
		}
		if( !me.isLoaded		) {
			me.load();
			me.update();
		}

		var newItem = new CartItem();

		/* check to ensure arguments have been passed in */
		if( !arguments || arguments.length === 0 ){
			error( 'No values passed for item.');
			return null;
		}
		var argumentArray = arguments;
		if( values && typeof( values ) !== 'string' && typeof( values ) !== 'number'  ){
			argumentArray = values;
		}

		newItem.parseValuesFromArray( argumentArray );
		newItem.checkQuantityAndPrice();

		/* if the item already exists, update the quantity */
		if( me.hasItem(newItem) ) {
			var foundItem=me.hasItem(newItem);
			foundItem.quantity= parseInt(foundItem.quantity,10) + parseInt(newItem.quantity,10);
			newItem = foundItem;
		} else {
			me.items[newItem.id] = newItem;
		}

		me.update();
		return newItem;
		
	};


	me.remove = function( id ){
		var tempArray = {};
			
		me.each(function(item){
			if( item.id !== id ){
				tempArray[item.id] = item;
			}
		});
		this.items = tempArray;
	};

	me.empty = function () {
		simpleCart.items = {};
		simpleCart.update();
	};

	/******************************************************
			 item accessor functions
	 ******************************************************/

	me.find = function (criteria) {
		if( !criteria ){
			return null;
		}
		
		var results = [];
			
		me.each(function(item,x,next){ 	
	
			fits = true;
		
			me.each( criteria , function(value,j,name){
				if( !item[name] || item[name] != value ){
					fits = false;
				}
			});
			
			if( fits ){
				results.push( item );
			}
		});
		return (results.length === 0 ) ? null : results;
	};
	
	
	me.each = function( array , callback ){
		var next,
			x=0, 
			result;

		if( typeof array === 'function' ){
			var cb = array
				items = me.items;
		} else if( typeof callback === 'function' ){
			var cb = callback,
				items = array;
		} else {
			return;
		}
		
		for( next in items ){
			if( typeof items[next] !== "function" ){
				result = cb.call( me , items[next] , x , next );
				if( result === false ){
					return;
				}
				x++;
			}
		}
		
	};
	
	
	me.chunk = function(str, n) {
		if (typeof n==='undefined'){ 
			n=2;
		}
		var result = str.match(RegExp('.{1,'+n+'}','g'));
		return result || [];
	};


	/******************************************************
			 checkout management
	 ******************************************************/

	me.checkout = function() {
		if( simpleCart.quantity === 0 ){
			error("Cart is empty");
			return;
		}
		switch( simpleCart.checkoutTo ){
			case PayPal:
				simpleCart.paypalCheckout();
				break;
			case GoogleCheckout:
				simpleCart.googleCheckout();
				break;
			case Email:
				simpleCart.emailCheckout();
				break;
			default:
				simpleCart.customCheckout();
				break;
		}
	};

	me.paypalCheckout = function() {

		var me = this,
			winpar = "scrollbars,location,resizable,status",
			strn  = "https://www.paypal.com/cgi-bin/webscr?cmd=_cart" +
					"&upload=1" +
					"&business=" + me.email +
					"&currency_code=" + me.currency,
			counter = 1,
			itemsString = "",
			current,
			item,
			optionsString,
			field;


		if( me.taxRate ){
			strn = strn +
				"&tax_cart=" +	me.currencyStringForPaypalCheckout( me.taxCost );
		}

		me.each(function(item,iter){
			
			counter = iter+1;
			optionsString = "";
			
			me.each( item , function( value, x , field ){
				if( field !== "id" && field !== "price" && field !== "quantity" && field !== "name" && field !== "shipping") {
					optionsString = optionsString + ", " + field + "=" + value ;
				}
			});
			optionsString = optionsString.substring(2);

			itemsString = itemsString	+ "&item_name_"		+ counter + "=" + item.name	 +
										  "&item_number_"	+ counter + "=" + counter +
										  "&quantity_"		+ counter + "=" + item.quantity +
										  "&amount_"		+ counter + "=" + me.currencyStringForPaypalCheckout( item.price ) +
										  "&on0_"			+ counter + "=" + "Options" +
										  "&os0_"			+ counter + "=" + optionsString;
		});

		if( me.shipping() !== 0){
			 itemsString = itemsString	+	"&shipping=" + me.currencyStringForPaypalCheckout( me.shippingCost );
		}
		
		if( me.successUrl ){
			itemsString = itemsString + "&return=" + me.successUrl;
		}
		
		if( me.cancelUrl ){
			itemsString = itemsString + "&cancel_return=" + me.cancelUrl;
		}


		strn = strn + itemsString ;
		window.open (strn, "paypal", winpar);
	};

	me.googleCheckout = function() {
		var me = this;
		
		
		if( me.currency !== USD && me.currency !== GBP ){
			error( "Google Checkout only allows the USD and GBP for currency.");
			return;
		} else if( me.merchantId === "" || me.merchantId === null || !me.merchantId ){
			error( "No merchant Id for google checkout supplied.");
			return;
		}

		var form = document.createElement("form"),
			counter=1,
			current,
			item,
			descriptionString;
			
		form.style.display = "none";
		form.method = "POST";
		form.action = "https://checkout.google.com/api/checkout/v2/checkoutForm/Merchant/" +
						me.merchantId;
		form.acceptCharset = "utf-8";

		me.each(function(item,iter){
				
			counter = iter+1;
		
			form.appendChild( me.createHiddenElement( "item_name_"		+ counter, item.name		) );
			form.appendChild( me.createHiddenElement( "item_quantity_"	+ counter, item.quantity	) );
			form.appendChild( me.createHiddenElement( "item_price_"		+ counter, item.price		) );
			form.appendChild( me.createHiddenElement( "item_currency_"	+ counter, me.currency		) );
			form.appendChild( me.createHiddenElement( "item_tax_rate_"	+ counter, me.taxRate		) );
			form.appendChild( me.createHiddenElement( "_charset_"				 , ""				) );

			descriptionString = "";

			me.each( item , function( value , x , field ){
			
				if( field !== "id"		&&
					field !== "quantity" &&
					field !== "price" ) {
						
						descriptionString = descriptionString + ", " + field + ": " + value;
				}
			});
			
			descriptionString = descriptionString.substring( 1 );
			form.appendChild( me.createHiddenElement( "item_description_" + counter, descriptionString) );

		});
		
		// hack for adding shipping
		if( me.shipping() !== 0){
		   form.appendChild(me.createHiddenElement("ship_method_name_1", "Shipping"));
		   form.appendChild(me.createHiddenElement("ship_method_price_1", parseFloat(me.shippingCost).toFixed(2)));
		   form.appendChild(me.createHiddenElement("ship_method_currency_1", me.currency));
		}

		document.body.appendChild( form );
		form.submit();
		document.body.removeChild( form );
	};



	me.emailCheckout = function() {
		return;
	};

	me.customCheckout = function() {
				var me = this,
			winpar = "scrollbars,location,resizable,status",
			strn  = "https://www.nganluong.vn/button_payment.php?receiver=" + me.email,
			counter = 1,
			itemsName = "",
			itemsComment = "&comments=Thanh%20to%C3%A1n%20%C4%91%E1%BA%B7t%20h%C3%A0ng%20tr%E1%BB%B1c%20tuy%E1%BA%BFn",
			itemsPrice = 0,
			current,
			item,
			optionsString,
			field;

		me.each(function(item,iter){
			if (itemsName == "") {
				itemsName = "&product_name=" + item.name;
			}
			else {
				itemsName = itemsName + ", " + item.name;
			}
			itemsPrice = itemsPrice + item.price*item.quantity;
			if (item.quantity > 1) {
					itemsName = itemsName + " x " + item.quantity;
				}
			
		});
		
		
		itemsPrice = "&price=" + itemsPrice;
		if( me.successUrl ){
			itemsName = itemsName + "&return_url=" + me.successUrl;
		}

		strn = strn + encodeURI(itemsName) + itemsPrice  + itemsComment;
		window.open (strn, "Ngan Luong", winpar);
		return;
	};




	/******************************************************
				data storage and retrival
	 ******************************************************/

	/* load cart from cookie */
	me.load = function () {
		var me = this,
			id;
			
		/* initialize variables and items array */
		me.items = {};
		me.total = 0.00;
		me.quantity = 0;

		/* retrieve item data from cookie */
		if( readCookie(simpleCart.storagePrefix + 'simpleCart_' + "chunks") ){
			var chunkCount = 1*readCookie(simpleCart.storagePrefix + 'simpleCart_' + "chunks"),
				dataArray = [],
				dataString = "",
				data = "",
				info,
				newItem,
				y=0;
			if(chunkCount>0) {	
				for( y=0;y<chunkCount;y++){
					dataArray.push( readCookie( simpleCart.storagePrefix + 'simpleCart_' + (1 + y ) ) );
				}
			
				dataString = unescape( dataArray.join("") );
				data = dataString.split("++");
			}
			for(var x=0, xlen=data.length;x<xlen;x++){

				info = data[x].split('||');
				newItem = new CartItem();

				if( newItem.parseValuesFromArray( info ) ){
					newItem.checkQuantityAndPrice();
					/* store the new item in the cart */
					me.items[newItem.id] = newItem;
				}
			}
		}
	
		me.isLoaded = true;
	};



	/* save cart to cookie */
	me.save = function () {
		var dataString = "",
			dataArray = [],
			chunkCount = 0;
			
		chunkCount = 1*readCookie(simpleCart.storagePrefix + 'simpleCart_' + "chunks");
		for( var j=0;j<chunkCount;j++){
			eraseCookie(simpleCart.storagePrefix + 'simpleCart_'+ j);
		}
		eraseCookie(simpleCart.storagePrefix + 'simpleCart_' + "chunks");
		
			
		me.each(function(item){
			dataString = dataString + "++" + item.print();
		});
		
		dataArray = simpleCart.chunk( dataString.substring(2) , simpleCart.MAX_COOKIE_SIZE );
		
		for( var x=0,xlen = dataArray.length;x<xlen;x++){
			createCookie(simpleCart.storagePrefix + 'simpleCart_' + (1 + x ), dataArray[x], me.cookieDuration );
		}
				
		createCookie( simpleCart.storagePrefix + 'simpleCart_' + "chunks", "" + dataArray.length , me.cookieDuration );
	};



	/******************************************************
				 view management
	 ******************************************************/

	me.initializeView = function() {
		var me = this;
		me.totalOutlets				= getElementsByClassName('simpleCart_total');
		me.quantityOutlets			= getElementsByClassName('simpleCart_quantity');
		me.cartDivs					= getElementsByClassName('simpleCart_items');
		me.taxCostOutlets			= getElementsByClassName('simpleCart_taxCost');
		me.taxRateOutlets			= getElementsByClassName('simpleCart_taxRate');
		me.shippingCostOutlets		= getElementsByClassName('simpleCart_shippingCost');
		me.finalTotalOutlets		= getElementsByClassName('simpleCart_finalTotal');

		me.addEventToArray( getElementsByClassName('simpleCart_checkout') , simpleCart.checkout , "click");
		me.addEventToArray( getElementsByClassName('simpleCart_empty')	, simpleCart.empty , "click" );
		
		me.Shelf = new Shelf();
		me.Shelf.readPage();

		me.pageIsReady = true;

	};



	me.updateView = function() {
		me.updateViewTotals();
		if( me.cartDivs && me.cartDivs.length > 0 ){
			me.updateCartView();
		}
	};

	me.updateViewTotals = function() {
		var outlets = [ ["quantity"		, "none"		] ,
						["total"		, "currency"	] ,
						["shippingCost" , "currency"	] ,
						["taxCost"		, "currency"	] ,
						["taxRate"		, "percentage"	] ,
						["finalTotal"	, "currency"	] ];

		for( var x=0,xlen=outlets.length; x<xlen;x++){

			var arrayName = outlets[x][0] + "Outlets",
				outputString,
				element;

			for( var y = 0,ylen = me[ arrayName ].length; y<ylen; y++ ){ 
				switch( outlets[x][1] ){
					case "none":
						outputString = "" + me[outlets[x][0]];
						break;
					case "currency":
						outputString = me.valueToCurrencyString( me[outlets[x][0]] );
						break;
					case "percentage":
						outputString = me.valueToPercentageString( me[outlets[x][0]] );
						break;
					default:
						outputString = "" + me[outlets[x][0]];
						break;
				}
				me[arrayName][y].innerHTML = "" + outputString;
			}
		}
	};

	me.updateCartView = function() {
		var newRows = [],
			y,newRow,current,header,newCell,info,outputValue,option,headerInfo;

		/* create headers row */
		newRow = document.createElement('div');
		for(var y=0,ylen = me.cartHeaders.length; y<ylen; y++ ){
			newCell = document.createElement('div');
			headerInfo = me.cartHeaders[y].split("_");

			newCell.innerHTML = me.print( headerInfo[0] );
			newCell.className = "item" + headerInfo[0];
			for(var z=1,zlen=headerInfo.length;z<zlen;z++){
				if( headerInfo[z].toLowerCase() == "noheader" ){
					newCell.style.display = "none";
				}
			}
			newRow.appendChild( newCell );

		}
		newRow.className = "cartHeaders";
		newRows[0] = newRow;

		/* create a row for each item in the cart */
		me.each(function(item, x){
			newRow = document.createElement('div');

			for(var y=0,ylen = me.cartHeaders.length; y<ylen; y++ ){
				newCell = document.createElement('div');
				info = me.cartHeaders[y].split("_");
			
				outputValue = me.createCartRow( info , item , outputValue );

				newCell.innerHTML = outputValue;
				newCell.className = "item" + info[0];
			
				newRow.appendChild( newCell );
			}
			newRow.className = "itemContainer";
			newRows[x+1] = newRow;
		});



		for( var x=0,xlen=me.cartDivs.length; x<xlen; x++){

			/* delete current rows in div */
			var div = me.cartDivs[x];
			if( div.childNodes && div.appendChild ){
				while( div.childNodes[0] ){
					div.removeChild( div.childNodes[0] );
				}
			

				for(var j=0, jLen = newRows.length; j<jLen; j++){
					div.appendChild( newRows[j] );
				}
			}

		}
	};
	
	me.createCartRow = function( info , item , outputValue ){
				
		switch( info[0].toLowerCase() ){
			case "total":
				outputValue = me.valueToCurrencyString(parseFloat(item.price)*parseInt(item.quantity,10) );
				break;
			case "increment":
				outputValue = me.valueToLink( "+" , "javascript:;" , "onclick=\"simpleCart.items[\'" + item.id + "\'].increment();\"" );
				break;
			case "decrement":
				outputValue = me.valueToLink( "-" , "javascript:;" , "onclick=\"simpleCart.items[\'" + item.id + "\'].decrement();\"" );
				break;
			case "remove":
				outputValue = me.valueToLink( "Remove" , "javascript:;" , "onclick=\"simpleCart.items[\'" + item.id + "\'].remove();\"" );
				break;
			case "price":
				outputValue = me.valueToCurrencyString( item[ info[0].toLowerCase() ] ? item[info[0].toLowerCase()] : " " );
				break;
			default: 
				outputValue = item[ info[0].toLowerCase() ] ? item[info[0].toLowerCase()] : " ";
				break;
		}	
		
		for( var y=1,ylen=info.length;y<ylen;y++){
			option = info[y].toLowerCase();
			switch( option ){
				case "image":
				case "img":
					outputValue = me.valueToImageString( outputValue );		
					break;
				case "input":
					outputValue = me.valueToTextInput( outputValue , "onchange=\"simpleCart.items[\'" + item.id + "\'].set(\'" + info[0].toLowerCase() + "\' , this.value);\""	);
					break;
				case "div":
				case "span":
				case "h1":
				case "h2":
				case "h3":
				case "h4":
				case "p":
					outputValue = me.valueToElement( option , outputValue , "" );
					break;
				case "noheader":
					break;
				default:
					error( "unkown header option: " + option );
					break;
			}
		
		}		  
		return outputValue;
	};

	me.addEventToArray = function ( array , functionCall , theEvent ) {
		var outlet, 
			element;
		
		for(var x=0,xlen=array.length; x<xlen; x++ ){
			element = array[x];
			if( element.addEventListener ) {
				element.addEventListener(theEvent, functionCall , false );
			} else if( element.attachEvent ) {
				element.attachEvent( "on" + theEvent, functionCall );
			}
		}
	};


	me.createHiddenElement = function ( name , value ){
		var element = document.createElement("input");
		element.type = "hidden";
		element.name = name;
		element.value = value;
		return element;
	};



	/******************************************************
				Currency management
	 ******************************************************/

	me.currencySymbol = function() {
		switch(me.currency){
			case CHF:
				return "CHF&nbsp;";
			case CZK:
				return "CZK&nbsp;";
			case DKK:
				return "DKK&nbsp;";
			case HUF:
				return "HUF&nbsp;";
			case NOK:
				return "NOK&nbsp;";
			case PLN:
				return "PLN&nbsp;";
			case SEK:
				return "SEK&nbsp;";
			case JPY:
				return "&yen;";
			case EUR:
				return "&euro;";
			case GBP:
				return "&pound;";
			case CHF:
				return "CHF&nbsp;";
			case THB: 
				return "&#3647;";
			case USD:
			case VND:
				return "VNĐ&nbsp;";
			case CAD:
			case AUD:
			case NZD:
			case HKD:
			case SGD:
				return "&#36;";
			default:
				return "";
		}
	};


	me.currencyStringForPaypalCheckout = function( value ){
		if( me.currencySymbol() == "&#36;" ){
			return "$" + parseFloat( value ).toFixed(2);
		} else {
			return "" + parseFloat(value ).toFixed(2);
		}
	};

	/******************************************************
				Formatting
	 ******************************************************/


	me.valueToCurrencyString = function( value ) {
		var val =  parseFloat( value ); 
		if( isNaN(val))
			val = 0;

		return val.toCurrency( me.currencySymbol() );
	};

	me.valueToPercentageString = function( value ){
		return parseFloat( 100*value ) + "%";
	};

	me.valueToImageString = function( value ){
		if( value.match(/<\s*img.*src\=/) ){
			return value;
		} else {
			return "<img src=\"" + value + "\" />";
		}
	};

	me.valueToTextInput = function( value , html ){
		return "<input type=\"text\" value=\"" + value + "\" " + html + " />";
	};

	me.valueToLink = function( value, link, html){
		return "<a href=\"" + link + "\" " + html + " >" + value + "</a>";
	};

	me.valueToElement = function( type , value , html ){
		return "<" + type + " " + html + " > " + value + "</" + type + ">";
	};

	/******************************************************
				Duplicate management
	 ******************************************************/

	me.hasItem = function ( item ) {
		var current, 
			matches,
			field,
			match=false;
		
		me.each(function(testItem){ 
			
			matches = true;
			
			me.each( item , function( value , x , field ){ 
				
				if( field !== "quantity" && field !== "id" && item[field] !== testItem[field] ){
					matches = false;
				}
			});
			
			if( matches ){
				match = testItem;
			}
			
		});
		return match;
	};
	
	/******************************************************
				Language managment
	 ******************************************************/
	me.ln = {
		"en_us": {
			  quantity: "Số lượng"
			, price: "Giá"
			, name: "Tên hàng"
			, size: "Loại"
			, total: "Tổng cộng"
			, decrement: "Bớt"
			, increment: "Thêm"
			, remove: "Bỏ"
			, tax: "Thuế"
			, shipping: "Vận chuyển"
			, image: "Ảnh"
		} 
	};
	
	me.language = "en_us"; 
	
	me.print = function( input ) {
		var me = this;
		return me.ln[me.language] && me.ln[me.language][input.toLowerCase()] ? me.ln[me.language][input.toLowerCase()] : input;
		
	};


	/******************************************************
				Cart Update managment
	 ******************************************************/

	me.update = function() {
		if( !simpleCart.isLoaded ){
			simpleCart.load();
		}
		if( !simpleCart.pageIsReady ){
			simpleCart.initializeView();
		}
		me.updateTotals();
		me.updateView();
		me.save();
	};

	me.updateTotals = function() {
			
		me.total = 0 ;
		me.quantity	 = 0;
		me.each(function(item){ 
			
			if( item.quantity < 1 ){
				item.remove();
			} else if( item.quantity !== null && item.quantity !== "undefined" ){
				me.quantity = parseInt(me.quantity,10) + parseInt(item.quantity,10);
			}
			if( item.price ){
				me.total = parseFloat(me.total) + parseInt(item.quantity,10)*parseFloat(item.price);
			}
			
		});
		me.shippingCost = me.shipping();
		me.taxCost = parseFloat(me.total)*me.taxRate;
		me.finalTotal = me.shippingCost + me.taxCost + me.total;
	};

	me.shipping = function(){
		if( parseInt(me.quantity,10)===0 )
			return 0;
		var shipping =	parseFloat(me.shippingFlatRate) +
						parseFloat(me.shippingTotalRate)*parseFloat(me.total) +
						parseFloat(me.shippingQuantityRate)*parseInt(me.quantity,10),
			next;
		
		me.each(function(nextItem){ 		
			if( nextItem.shipping ){
				if( typeof nextItem.shipping == 'function' ){
					shipping += parseFloat(nextItem.shipping());
				} else {
					shipping += parseFloat(nextItem.shipping);
				}
			}
		});

		return shipping;
	}

	me.initialize = function() {
		simpleCart.initializeView();
		simpleCart.load();
		simpleCart.update();
	};

}

/********************************************************************************************************
 *			Cart Item Object
 ********************************************************************************************************/

function CartItem() {
	while( simpleCart.items["c" + simpleCart.nextId] )	
		simpleCart.nextId++;
		
	this.id = "c" + simpleCart.nextId;
}
	CartItem.prototype.set = function ( field , value ){
		field = field.toLowerCase();
		if( typeof( this[field] ) !== "function" && field !== "id" ){
			if( field == "quantity" ){
				value = value.replace( /[^(\d|\.)]*/gi , "" );
				value = value.replace(/,*/gi, "");
				value = parseInt(value,10);
			} else if( field == "price"){
				value = value.replace( /[^(\d|\.)]*/gi, "");
				value = value.replace(/,*/gi , "");
				value = parseFloat( value );
			}
			if( typeof(value) == "number" && isNaN( value ) ){
				error( "Improperly formatted input.");
			} else {
				if( value.match(/\~|\=/) ){
					error("Special character ~ or = not allowed: " + value);
				}
				value = value.replace(/\~|\=/g, "");
				this[field] = value;
				this.checkQuantityAndPrice();
			}
		} else {
			error( "Cannot change " + field + ", this is a reserved field.");
		}
		simpleCart.update();
	};

	CartItem.prototype.increment = function(){
		this.quantity = parseInt(this.quantity,10) + 1;
		simpleCart.update();
	};

	CartItem.prototype.decrement = function(){
		if( parseInt(this.quantity,10) < 2 ){
			this.remove();
		} else {
			this.quantity = parseInt(this.quantity,10) - 1;
			simpleCart.update();
		}
	};

	CartItem.prototype.print = function () {
		var returnString = '',
			field;
		simpleCart.each(this ,function(item,x,name){ 	
			returnString+= escape(name) + "=" + escape(item) + "||";
		});
		return returnString.substring(0,returnString.length-2);
	};


	CartItem.prototype.checkQuantityAndPrice = function() {

		if( !this.quantity || this.quantity == null || this.quantity == 'undefined'){ 
			this.quantity = 1;
			error('No quantity for item.');
		} else {
			this.quantity = ("" + this.quantity).replace(/,*/gi, "" );
			this.quantity = parseInt( ("" + this.quantity).replace( /[^(\d|\.)]*/gi, "") , 10);
			if( isNaN(this.quantity) ){
				error('Quantity is not a number.');
				this.quantity = 1;
			}
		}

		if( !this.price || this.price == null || this.price == 'undefined'){
			this.price=0.00;
			error('No price for item or price not properly formatted.');
		} else {
			this.price = ("" + this.price).replace(/,*/gi, "" );
			this.price = parseFloat( ("" + this.price).replace( /[^(\d|\.)]*/gi, "") );
			if( isNaN(this.price) ){
				error('Price is not a number.');
				this.price = 0.00;
			}
		}
	};


	CartItem.prototype.parseValuesFromArray = function( array ) {
		if( array && array.length && array.length > 0) {
			for(var x=0, xlen=array.length; x<xlen;x++ ){

				/* ensure the pair does not have key delimeters */
				array[x] = array[x].replace(/\|\|/g, "| |");
				array[x] = array[x].replace(/\+\+/g, "+ +");
				if( array[x].match(/\~/) ){
					error("Special character ~ not allowed: " + array[x]);
				}
				array[x] = array[x].replace(/\~/g, "");
				

				/* split the pair and save the unescaped values to the item */
				var value = array[x].split('=');
				if( value.length>1 ){
					if( value.length>2 ){
						for(var j=2, jlen=value.length;j<jlen;j++){
							value[1] = value[1] + "=" + value[j];
						}
					}
					this[ unescape(value[0]).toLowerCase() ] = unescape(value[1]);
				}
			}
			return true;
		} else {
			return false;
		}
	};

	CartItem.prototype.remove = function() {
		simpleCart.remove(this.id);
		simpleCart.update();
	};



/********************************************************************************************************
 *			Shelf Object for managing items on shelf that can be added to cart
 ********************************************************************************************************/

function Shelf(){
	this.items = {};
}
	Shelf.prototype.readPage = function () {
		this.items = {};
		var newItems = getElementsByClassName( "simpleCart_shelfItem" ),
			newItem;
			me = this;
		
		for( var x = 0, xlen = newItems.length; x<xlen; x++){
			newItem = new ShelfItem();
			me.checkChildren( newItems[x] , newItem );
			me.items[newItem.id] = newItem;
		}
	};

	Shelf.prototype.checkChildren = function ( item , newItem) {
		if( !item.childNodes )
			return;
		for(var x=0;item.childNodes[x];x++){

			var node = item.childNodes[x];
			if( node.className && node.className.match(/item_[^ ]+/) ){

				var data = /item_[^ ]+/.exec(node.className)[0].split("_");

				if( data[1] == "add" || data[1] == "Add" ){
					var tempArray = [];
					tempArray.push( node );
					var addFunction = simpleCart.Shelf.addToCart(newItem.id);
					simpleCart.addEventToArray( tempArray , addFunction , "click");
					node.id = newItem.id;
				} else {
					newItem[data[1]]  = node;
				}
			}
			if( node.childNodes[0] ){
				this.checkChildren( node , newItem );
			}
		}
	};

	Shelf.prototype.empty = function () {
		this.items = {};
	};


	Shelf.prototype.addToCart = function ( id ) {
		return function(){
			if( simpleCart.Shelf.items[id]){
				simpleCart.Shelf.items[id].addToCart();
			} else {
				error( "Shelf item with id of " + id + " does not exist.");
			}
		};
	};


/********************************************************************************************************
 *			Shelf Item Object
 ********************************************************************************************************/


function ShelfItem(){
	this.id = "s" + simpleCart.nextId++;
}
	ShelfItem.prototype.remove = function () {
		simpleCart.Shelf.items[this.id] = null;
	};


	ShelfItem.prototype.addToCart = function () {
		var outStrings = [],
			valueString,
			field;
			
		for( field in this ){
			if( typeof( this[field] ) !== "function" && field !== "id" ){
				valueString = "";

				switch(field){
					case "price":
						if( this[field].value ){
							valueString = this[field].value;
						} else if( this[field].innerHTML ) {
							valueString = this[field].innerHTML;
						}
						/* remove all characters from price except digits and a period */
						valueString = valueString.replace( /[^(\d|\.)]*/gi , "" );
						valueString = valueString.replace( /,*/ , "" );
						break;
					case "image":
						valueString = this[field].src;
						break;
					default:
						if( this[field].value ){
							valueString = this[field].value;
						} else if( this[field].innerHTML ) {
							valueString = this[field].innerHTML;
						} else if( this[field].src ){
							valueString = this[field].src;
						} else {
							valueString = this[field];
						}
						break;
				}
				outStrings.push( field + "=" + valueString );
			}
		}

		simpleCart.add( outStrings );
	};



/********************************************************************************************************
 * Thanks to Peter-Paul Koch for these cookie functions (http://www.quirksmode.org/js/cookies.html)
 ********************************************************************************************************/
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	value = value.replace(/\=/g, '~');
	document.cookie = name + "=" + escape(value) + expires + "; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0){
			var value = unescape(c.substring(nameEQ.length, c.length));
			return value.replace(/\~/g, '=');
		} 
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}


//*************************************************************************************************
/*
	Developed by Robert Nyman, http://www.robertnyman.com
	Code/licensing: http://code.google.com/p/getelementsbyclassname/
*/
var getElementsByClassName = function (className, tag, elm){
	if (document.getElementsByClassName) {
		getElementsByClassName = function (className, tag, elm) {
			elm = elm || document;
			var elements = elm.getElementsByClassName(className),
				nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null,
				returnElements = [],
				current;
			for(var i=0, il=elements.length; i<il; i+=1){
				current = elements[i];
				if(!nodeName || nodeName.test(current.nodeName)) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	else if (document.evaluate) {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = "",
				xhtmlNamespace = "http://www.w3.org/1999/xhtml",
				namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace : null,
				returnElements = [],
				elements,
				node;
			for(var j=0, jl=classes.length; j<jl; j+=1){
				classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
			}
			try {
				elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
			}
			catch (e) {
				elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
			}
			while ((node = elements.iterateNext())) {
				returnElements.push(node);
			}
			return returnElements;
		};
	}
	else {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = [],
				elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag),
				current,
				returnElements = [],
				match;
			for(var k=0, kl=classes.length; k<kl; k+=1){
				classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
			}
			for(var l=0, ll=elements.length; l<ll; l+=1){
				current = elements[l];
				match = false;
				for(var m=0, ml=classesToCheck.length; m<ml; m+=1){
					match = classesToCheck[m].test(current.className);
					if (!match) {
						break;
					}
				}
				if (match) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	return getElementsByClassName(className, tag, elm);
};


/********************************************************************************************************
 *	Helpers
 ********************************************************************************************************/


String.prototype.reverse=function(){return this.split("").reverse().join("");};
Number.prototype.withCommas=function(){var x=6,y=parseFloat(this).toFixed(2).toString().reverse();while(x<y.length){y=y.substring(0,x)+","+y.substring(x);x+=4;}return y.reverse();};
Number.prototype.toCurrency=function(){return(arguments[0]?arguments[0]:"$")+this.withCommas();};


/********************************************************************************************************
 * error management
 ********************************************************************************************************/

function error( message ){
	try{
		console.log( message );
	}catch(err){
	//	alert( message );
	}
}


var simpleCart = new Cart();

if( typeof jQuery !== 'undefined' ) $(document).ready(function(){simpleCart.initialize();});
else if( typeof Prototype !== 'undefined') Event.observe( window, 'load', function(){simpleCart.initialize();});
else window.onload = simpleCart.initialize;
