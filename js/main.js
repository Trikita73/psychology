// $('.container').fsScroll({

//   // beforeScroll: function(el, index) {
//   //   el.find('h1').addClass('text-animate');
//   // },

//   // afterScroll: function(el, index) {
//   //   el.find('h1').removeClass('text-animate');
//   // }
// })


//JQuery: He is responsible for the slow scroll and loader -->

$(window).load(function() {
	$(".loader_inner").fadeOut();
	$(".loader").delay(1900).fadeOut("slow");

});