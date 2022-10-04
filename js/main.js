$('.container').fsScroll({

  beforeScroll: function(el, index) {
    el.find('h1').addClass('text-animate');
  },

  afterScroll: function(el, index) {
    el.find('h1').removeClass('text-animate');
  }
})
