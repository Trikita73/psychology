(function($) {
  'use strict';

  /**  Возвращает поддерживаемые браузером префиксы анимации css  */
  var _prefix = (function(domNode) {
    var prefixs = ['webkit', 'Moz', 'o', 'ms'],
        props;

    for(var i in prefixs) {
      props = prefixs[i] + 'Transition';
      if(domNode.style[props] !== undefined) {
        return '-' + prefixs[i].toLowerCase() + '-';
      }
    }
    return false;
  })(document.createElement('div'));

  /** Параметры конфигурации по умолчанию */
  var DEFAULT = {
    /** имя класса структуры dom */
    selectors: {
      sections: '.sections',
      section: '.section',
      page: '.page',
      active: '.active'
    },
    /** индекс текущей страницы */
    index: 0,
    /** кривая анимации */
    timing: 'ease',
    /** время анимации */
    duration: 500,
    /** Зацикливаться ли */
    loop: false,
    /** Показывать ли точки нумерации страниц */
    pagination: true,
    /** Поддерживать ли работу с клавиатурой */
    keyboard: false,
    /** проведите направление */
    direction: 'vertical',
    /** проведите стартовое событие */
    beforeScroll: null,
    /** Событие после окончания свайпа */
    afterScroll: null
  };

  function FsScroll(element, options) {
    this.element = element;
    this.options = $.extend({}, DEFAULT, options || {});
    this.init();
  }

  FsScroll.prototype = {
    /** Инициализировать свойства, запись события */
    init: function() {
      this.selectors = this.options.selectors;
      this.sections = this.element.find(this.selectors.sections);
      this.section = this.element.find(this.selectors.section);
      this.isVertical = this.options.direction === 'vertical' ? true : false;
      this.pagesCount = this.pagesCount();
      this.index = (this.options.index >=0 && this.options.index < this.pagesCount) ? this.options.index : 0;
      this.canScroll = true;

      this._addPosition();

      if(!this.isVertical || this.index) {
        this._initLayout();
      }

      if(this.options.pagination) {
        this._initPagination();
      }

      this._initEvent();
    },

    /** Получить количество скользящих страниц */
    pagesCount: function() {
      return this.section.length;
    },

    /** перевернуть на одну страницу вперед */
    prev: function() {
      if(this.index) {
        this.index--;
      }else {
        this.index = this.pagesCount - 1;
      }
      this._scrollPage();
    },

    /** вернуться на одну страницу назад */
    next: function() {
      if(this.index === this.pagesCount - 1) {
        this.index = 0;
      }else {
        this.index++;
      }
      this._scrollPage();
    },

    /**
     * Получить расстояние
     */
    _getScrollLength: function() {
      return this.isVertical ? this.element.height() : this.element.width();
    },

    /** Чтобы правильно рассчитать позицию каждой страницы, нужно добавить родительский контейнер с относительным позиционированием */
    _addPosition: function() {
      var position = this.sections.css('position');
      if(!position || position !== 'relative') {
        this.sections.css('position', 'relative');
      }
    },

    /** Инициализировать горизонтальное раздвижное расположение */
    _initLayout: function() {
      if(!this.isVertical) {
        var width = this.pagesCount * 100 + '%',
            pageWidth = (100/this.pagesCount).toFixed(2) + '%';
        this.sections.width(width);
        this.section.width(pageWidth).css('float', 'left');
      }

      if(this.index) {
        this._scrollPage(true);
      }
    },

    /** Инициализировать пейджинг */
    _initPagination: function() {
      var pageCls = this.selectors.page.substring(1),
          pageHtml = '<ul class=' + pageCls + '>';

      for(var i = 0; i < this.pagesCount; i++) {
        pageHtml += '<li></li>';
      }
      pageHtml += '</ul>';
      this.element.append(pageHtml);

      var pages = this.element.find(this.selectors.page);
      this.pageItem = pages.find('li');
      this.activeCls = this.selectors.active.substring(1);
      this.pageItem.eq(this.index).addClass(this.activeCls);

      if(this.isVertical) {
        pages.addClass('vertical');
      }else {
        pages.addClass('horizontal');
      }
    },

    /** событие инициализации */
    _initEvent: function() {
      var self = this;

      /** Привязать событие колесика мыши
       * firefox Событие колеса прокрутки DOMMouseScroll
       */
      self.element.on('mousewheel DOMMouseScroll', function(e) {
        e.preventDefault();
        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
        if(self.canScroll) {
          if(delta > 0 && (self.options.loop || self.index)) {
            self.prev();
          }else if(delta < 0 && (self.options.loop || self.index < self.pagesCount - 1)) {
            self.next();
          }
        }
      });

      /** Привязать события клавиатуры */
      if(self.options.keyboard) {
        $(document).on('keyup', function(e) {
          var keyCode = e.keyCode;
          if(keyCode === 37 || keyCode === 38) {
            self.prev();
          }else if(keyCode === 39 || keyCode === 40) {
            self.next();
          }
        })
      }

      /**
       * событие изменения размера окна
       * Получить смещение текущей страницы относительно смещения окна просмотра и скользить только тогда, когда смещение превышает половину
       */
      var timer = null;
      $(window).on('resize', function(){
        clearTimeout(timer);
        timer = setTimeout(function() {
          // Смещение на первой странице всегда равно 0 во время масштабирования и не влияет на
          if(!self.index) {
            return;
          }
          
          var offset = self.section.eq(self.index).offset();
          var scrollLength = self._getScrollLength();
          var offsetDelta = self.isVertical ? offset.top : offset.left;
          if(Math.abs(offsetDelta) > scrollLength / 2) {
            if(offsetDelta > 0) {
              self.index--;
            }else {
              self.index++;
            }
          }
          self._scrollPage();
        }, 200)
      });

      /** событие клика по пагинации */
      self.element.on('click', this.selectors.page + ' li', function(e) {
        self.index = $(this).index();
        self._scrollPage();
      });

      /** Запускается после окончания анимации перехода */
      if(_prefix) {
        self.sections.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend', function() {
          self.canScroll = true;
          self._afterScroll();
        })
      }
    },

    /** Пролистнуть на текущую страницу */
    _scrollPage: function(init) {
      var self = this,
          dest = self.section.eq(self.index).position();

      if(!dest) return;

      self.canScroll = false;
      this._beforeScroll();

      if(_prefix) {
        var translate = self.isVertical ? 'translateY(-' + dest.top + 'px)' : 'translateX(-' + dest.left + 'px)';
        self.sections.css(_prefix + 'transition', 'all ' + self.options.duration + 'ms ' + self.options.timing);
        self.sections.css(_prefix + 'transform', translate);
      }else {
        // Совместимость с функциями анимации jquery, которые не поддерживают анимацию перехода CSS3.
        var animateCss = self.isVertical ? {top: -dest.top} : {left: -dest.left};
        self.sections.animate(animateCss, self.options.duration, function() {
          self.canScroll = true;
          self._afterScroll();
        })
      }

      if(self.options.pagination && !init) {
        self.pageItem.eq(self.index).addClass(self.activeCls).siblings('li').removeClass(self.activeCls);
      }
    },

    /** Проведите, чтобы начать обработку */
    _beforeScroll: function() {
      var self = this;
      if(self.options.beforeScroll && $.type(self.options.beforeScroll) === 'function') {
        self.options.beforeScroll.call(self, self.section.eq(self.index), self.index);
      }
    },

    /** Проведите, чтобы завершить обработку */
    _afterScroll: function() {
      var self = this;
      if(self.options.afterScroll && $.type(self.options.afterScroll) === 'function') {
        self.options.afterScroll.call(self, self.section.eq(self.index), self.index);
      }
    }
  }

  /** 
   * Объект-прототип jQuery для привязки плагинов
   */
  $.fn.fsScroll = function(options) {
    return this.each(function() {
      var self = $(this),
          instance = self.data('fsScroll');

      if(!instance) {
        instance = new FsScroll(self, options);
        self.data('fsScroll', instance);
      }

      if(typeof options === 'string' && instance[options]) {
        return instance[options]();
      }
    })
  }

  $(function() {
    $('[data-fs-scroll]').fsScroll();
  })

})(jQuery);