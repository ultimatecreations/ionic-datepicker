//By Rajeshwar Patlolla - rajeshwar.patlolla@gmail.com
//https://github.com/rajeshwarpatlolla

(function () {
  'use strict';

  angular.module('ionic-datepicker')
    .directive('ionicDatepicker', IonicDatepicker);

  IonicDatepicker.$inject = ['$ionicPopup', '$ionicModal', '$timeout', 'IonicDatepickerService'];

  function IonicDatepicker($ionicPopup, $ionicModal, $timeout, IonicDatepickerService) {
    return {
      restrict: 'AE',
      replace: true,
      scope: {
        inputObj: "=inputObj"
      },
      link: function (scope, element, attrs) {
        // IDE definitions
        var ERRORS = {
          INPUT_PERIOD__SINGLE_NOT_PERIOD: {
            code: 'INPUT_PERIOD__SINGLE_NOT_PERIOD',
            en: 'Date is not single',
            ru: 'Должно быть не больше одной даты'
          },
          INPUT_PERIOD__DATES_NOT_PERIOD: {
            code: 'INPUT_PERIOD__DATES_NOT_PERIOD',
            en: 'Dates is not period',
            ru: 'Даты не являются периодом'
          },

          UNKNOWN_ERROR: {code: 'UNKNOWN_ERROR', en: 'Unknown error', ru: 'Неизвестная ошибка'},
          ERROR_DELETING_UNKNOWN_ERROR: {
            code: 'ERROR_DELETING_UNKNOWN_ERROR',
            en: 'Error deleting unknown error',
            ru: 'Ошибка удаления неизвестной ошибки'
          }
        };
        var SELECT_TYPE = {MULTI: 'multi', PERIOD: 'period', SINGLE: 'single'}; //['multi', 'period', 'single'];
        var ACCESS_TYPE = {READ_WRITE: 'read-write', READ: 'read'};
        var ERROR_LANGUAGE = {EN: 'en', RU: 'ru'};
        var TEMPLATE_TYPE = {POPUP: 'popup', MODAL: 'modal'};

        function start() {
          initErrors();
          initView();
          initDates();
          initCalendarDates();
          initBtns();
          initModal();
          setViewMonth();
          refreshDateList();
        }

        var errors;

        function initErrors() {
          scope.errors = {len: 0};
          Object.defineProperty(scope.errors, "len", {enumerable: false});

          errors = (function () {

            return {
              add: function (code) {
                if (!scope.errors.hasOwnProperty(code) && ERRORS.hasOwnProperty(code)) {
                  console.debug('0');
                  var err = ERRORS[code];
                  scope.errors[code] = ERRORS[code];
                } else if (!scope.errors.hasOwnProperty(code) && !ERRORS.hasOwnProperty(code)) {
                  console.debug(code);
                  err = ERRORS.UNKNOWN_ERROR;
                  scope.errors.UNKNOWN_ERROR = ERRORS.UNKNOWN_ERROR;
                }
                this.length();
                console.error(err);
              },
              remove: function (code) {
                if (scope.errors.hasOwnProperty(code) && ERRORS.hasOwnProperty(code)) {
                  delete scope.errors[code];
                } else if (scope.errors.hasOwnProperty(code) && !ERRORS.hasOwnProperty(code)) {
                  scope.errors.ERROR_DELETING_UNKNOWN_ERROR = ERRORS.ERROR_DELETING_UNKNOWN_ERROR;
                }
                this.length();
              },

              length: function () {
                scope.errors.len = 0;
                for (var err in scope.errors) {
                  scope.errors.len++;
                }
              }
            }
          })();
        }

        function initView() {
          //Setting the title, today, close and set strings for the date picker
          scope.templateType = (scope.inputObj.templateType && TEMPLATE_TYPE.hasOwnProperty(scope.inputObj.templateType) > -1) ? (scope.inputObj.templateType) : TEMPLATE_TYPE.POPUP;

          scope.currentMonth = '';
          scope.currentYear = '';
          //scope.disabledDates = [];

          scope.titleShow = !!scope.inputObj.titleShow;
          scope.title = scope.inputObj.title ? (scope.inputObj.title) : 'Select Date';

          scope.btnsIsNative = !!scope.inputObj.btnsIsNative;

          scope.btnOk = scope.inputObj.btnOk ? (scope.inputObj.btnOk) : 'Ok';
          scope.btnOkClass = scope.inputObj.btnOkClass ? (scope.inputObj.btnOkClass) : 'button-stable cal-button';

          scope.btnCancel = scope.inputObj.btnCancel ? (scope.inputObj.btnCancel) : 'Close';
          scope.btnCancelClass = scope.inputObj.btnCancelClass ? (scope.inputObj.btnCancelClass) : 'button-stable cal-button';

          scope.btnTodayShow = !!scope.inputObj.btnTodayShow;
          if (scope.btnTodayShow) {
            scope.btnToday = scope.inputObj.btnToday ? (scope.inputObj.btnToday) : 'Today';
            scope.btnTodayClass = scope.inputObj.btnTodayClass ? (scope.inputObj.btnTodayClass) : 'button-stable cal-button';
          }

          scope.btnClearShow = !!scope.inputObj.btnClearShow;
          if (scope.btnClearShow) {
            scope.btnClear = scope.inputObj.btnClear ? (scope.inputObj.btnClear) : 'Clear';
            scope.btnClearClass = scope.inputObj.btnClearClass ? (scope.inputObj.btnClearClass) : 'button-stable cal-button';
          }

          scope.selectType = (scope.inputObj.selectType && SELECT_TYPE.hasOwnProperty(scope.inputObj.selectType) > -1 ) ? (scope.inputObj.selectType) : SELECT_TYPE.MULTI;
          scope.accessType = (scope.inputObj.accessType && ACCESS_TYPE.hasOwnProperty(scope.inputObj.accessType) > -1) ? (scope.inputObj.accessType) : ACCESS_TYPE.READ_WRITE;
          scope.showErrors = (scope.inputObj.showErrors && scope.inputObj.showErrors !== true) ? false : true;
          scope.errorLanguage = (scope.inputObj.errorLanguage && ERROR_LANGUAGE.hasOwnProperty(scope.inputObj.errorLanguage)) ? (scope.inputObj.errorLanguage) : ERROR_LANGUAGE.EN;

          scope.closeOnSelect = !!scope.inputObj.closeOnSelect;

          // >> todo
          //scope.modalHeaderColor = scope.inputObj.modalHeaderColor ? (scope.inputObj.modalHeaderColor) : 'bar-stable';
          //scope.modalFooterColor = scope.inputObj.modalFooterColor ? (scope.inputObj.modalFooterColor) : 'bar-stable';
          //scope.dateFormat = scope.inputObj.dateFormat ? (scope.inputObj.dateFormat) : 'dd-MM-yyyy';
          // << todo

          // Setting the months list. This is useful, if the component needs to use some other language.
          scope.monthsList = [];
          if (scope.inputObj.monthList && scope.inputObj.monthList.length === 12) {
            scope.monthsList = scope.inputObj.monthList;
          } else {
            scope.monthsList = IonicDatepickerService.monthsList;
          }
          // weaklist
          if (scope.inputObj.weekDaysList && scope.inputObj.weekDaysList.length === 7) {
            scope.weekNames = scope.inputObj.weekDaysList;
          } else {
            scope.weekNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
          }

          // Setting whether to show Monday as the first day of the week or not.
          scope.mondayFirst = !!scope.inputObj.mondayFirst;

          if (scope.mondayFirst === true) {
            var lastWeekDay = scope.weekNames.shift();
            scope.weekNames.push(lastWeekDay);
          }
        }

        function glueDate(date) {
          if (date instanceof Date) {
            return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
          } else {
            return date.year * 10000 + date.month * 100 + date.date;
          }
        }

        function initDates() {

          // МАССИВ С ДАТАМИ:
          // рабочая копия и копия на случай отмены!
          if (scope.inputObj.selectedDates && scope.inputObj.selectedDates.length > 0) {
            scope.selectedDates = angular.copy(scope.inputObj.selectedDates);
            scope.inputDates = angular.copy(scope.inputObj.selectedDates);
          } else {
            scope.selectedDates = [];
            scope.inputDates = [];
          }

          // методы:
          scope.selectedDates.findDate = function (year, month, date) {
            if (scope.selectedDates.length > 0) {
              for (var i = 0; i < scope.selectedDates.length; i++) {
                var d = scope.selectedDates[i];
                if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === date) {
                  return {isPresent: true, i: i};
                }
              }
            }
            return {isPresent: false};
          };

          scope.selectedDates.addRemove = function (year, month, date) {
            var find = this.findDate(year, month, date);

            switch (scope.selectType) {
              case SELECT_TYPE.SINGLE:
                this.length = 0;
                if (find.isPresent) {
                  //scope.selectedDates.length = 0;
                } else {
                  this.push(new Date(year, month, date));
                }
                break;

              default:
                if (find.isPresent) {
                  this.splice(find.i, 1);
                } else {
                  this.push(new Date(year, month, date));
                }
            }
          };

          scope.selectedDates.clear = function () {
            this.length = 0;
          };

          scope.selectedDates.sortByDate = function (direction) {
            direction = (direction && direction === 'desc') ? -1 : 1;
            if (this.length > 0) {
              for (var i = 0; i < this.length; i++) {
                this[i].sortField = glueDate(this[i]);
              }
            }

            this.sort(function (a, b) {
              return (a.sortField - b.sortField) * direction;
            });

          };

          scope.selectedDates.getNearestFutureMonth = function () {
            var today = new Date();
            var curYear = today.getFullYear();
            var curMonth = today.getMonth();

            this.sortByDate();

            if (this.length > 0) {
              for (var i = 0; i < this.length; i++) {
                var d = this[i];
                var dYear = d.getFullYear(), dMonth = d.getMonth();
                if ((dYear == curYear && dMonth >= curMonth) || dYear > curYear) {
                  return {year: dYear, month: dMonth}
                }
              }
              return {year: curYear, month: curMonth};
            } else {
              return {year: curYear, month: curMonth};
            }
          };

          scope.selectedDates.checkPeriod = function () {

            if (scope.selectType === SELECT_TYPE.SINGLE) {
              var isTruePeriod = this.length <= 1;
              if (isTruePeriod) {
                errors.remove(ERRORS.INPUT_PERIOD__SINGLE_NOT_PERIOD.code);
              } else {
                errors.add(ERRORS.INPUT_PERIOD__SINGLE_NOT_PERIOD.code);
              }
              return isTruePeriod;
            }

            if (scope.selectType === SELECT_TYPE.MULTI) {
              isTruePeriod = true;
              return isTruePeriod;
            }

            // 'period':
            if (this.length > 1) {

              this.sortByDate();

              for (var i = 0; i < this.length - 1; i++) {
                if (this[i + 1].sortField - this[i].sortField !== 1) {
                  isTruePeriod = false;
                  errors.add(ERRORS.INPUT_PERIOD__DATES_NOT_PERIOD.code);
                  return isTruePeriod;
                }
              }
            }

            isTruePeriod = true;
            errors.remove(ERRORS.INPUT_PERIOD__DATES_NOT_PERIOD.code);
            return isTruePeriod;
          };

          scope.selectedDates.checkClones = function () {

            this.sortByDate();

            var i = 0;
            while (i < this.length - 1) {
              if (this[i].sortField === this[i + 1].sortField) {
                this.splice(i + 1, 1);
              } else {
                i++;
              }
            }
          };

          // Проверка входного периода!
          scope.selectedDates.checkClones();
          scope.selectedDates.checkPeriod();
        }

        function initCalendarDates() {


          // МАССИВ ДАТ КАЛЕНДАРИКА:
          scope.dayList = [];
          // методы:
          scope.dayList.zero = function () {
            this.length = 0;
          };

          scope.dayList.findDay = function (year, month, date) {
            for (var i = 0; i < this.length; i++) {
              if (this[i].year === year && this[i].month === month && this[i].date === date) {
                return i;
              }
            }
          };

          scope.dayList.repaint = function () {
            var viewMonthDates = [];
            scope.selectedDates.sortByDate();

            var firstDay = glueDate(this[0]);
            var lastDay = glueDate(this[this.length - 1]);

            var sd = scope.selectedDates;
            for (var i = 0; i < sd.length; i++) {
              if (sd[i].sortField >= firstDay && sd[i].sortField <= lastDay) {
                viewMonthDates.push(sd[i].sortField);
              } else if (sd[i].sortField > lastDay) {
                break;
              }
            }


            i = 0;
            while (i < this.length) {
              this[i].style.isSelected = viewMonthDates.indexOf(glueDate(this[i])) >= 0;
              i++;
            }
            // todo тут можно рисовать disabled dates, holidays
          };

          scope.dayList.repaintDay = function (year, month, date) {
            scope.dayList.repaint();
            var i = this.findDay(year, month, date);
            this[i].style.isSelected = !this[i].style.isSelected;
          };
        }

        function initBtns() {
          // BUTTONS:
          scope.btns = [];

          if (scope.btnClearShow && scope.accessType === ACCESS_TYPE.READ_WRITE) {
            scope.btns.push({
              text: scope.btnClear,
              type: scope.btnClearClass,
              onTap: function (e) {
                btnClear();
                if (scope.btnsIsNative) {
                  e.preventDefault();
                }
              }
            });
          }

          if (scope.btnTodayShow) {
            scope.btns.push({
              text: scope.btnToday,
              type: scope.btnTodayClass,
              onTap: function (e) {
                btnToday();
                if (scope.btnsIsNative) {
                  e.preventDefault();
                }
              }
            });
          }

          scope.btns.push({
            text: scope.btnCancel,
            type: scope.btnCancelClass,
            sType: 'cancel',
            onTap: function (e) {
              btnCancel();
              if (!scope.btnsIsNative) {
                scope.popup.close();
              }
            }
          });

          if (scope.accessType === ACCESS_TYPE.READ_WRITE) {
            scope.btns.push({
              text: scope.btnOk,
              type: scope.btnOkClass,
              sType: 'ok',
              onTap: function () {
                btnOk();
                if (!scope.btnsIsNative) {
                  scope.popup.close();
                }
              }
            });
          }
        }

        function initModal() {
          //Called when the user clicks on the Set' button of the modal
          scope.setIonicDatePickerDate = function () {
            btnOk();
            scope.closeModal();
          };
          //Called when the user clicks on the 'Close' button of the modal
          scope.closeIonicDatePickerModal = function () {
            btnCancel();
            scope.closeModal();
          };
          //Called when the user clicks on the 'Clear' button of the modal
          scope.clearIonicDatePickerModal = function () {
            btnClear();
            //scope.closeModal();
          };
          //Called when the user clicks on the 'Today' button of the modal
          scope.setIonicDatePickerTodayDate = function () {
            btnToday();
            //scope.inputObj.callback(undefined);
            //scope.closeModal();
          };

          if (scope.templateType === TEMPLATE_TYPE.MODAL) {
            //Getting the reference for the 'ionic-datepicker' modal.
            $ionicModal.fromTemplateUrl('ionic-datepicker-modal.html', {
              scope: scope,
              animation: 'slide-in-up'
            }).then(function (modal) {
              scope.modal = modal;
            });
            scope.openModal = function () {
              scope.modal.show();
            };

            scope.closeModal = function () {
              scope.modal.hide();
            };
          }
        }

        function setViewMonth() {
          // выбор отображаемого месяца (текущий или ближайшие впереди)
          if (scope.inputObj.viewMonth && scope.inputObj.viewMonth.length > 0) {
            scope.viewYear = scope.inputObj.viewMonth[0].getFullYear();
            scope.viewMonth = scope.inputObj.viewMonth[0].getMonth();
          } else if (scope.selectedDates && scope.selectedDates.length > 0) {
            var date = scope.selectedDates.getNearestFutureMonth();
            scope.viewYear = date.year;
            scope.viewMonth = date.month;
          } else {
            scope.viewYear = new Date().getFullYear();
            scope.viewMonth = new Date().getMonth();
          }
        }

        function refreshDateList() {

          var today = new Date();
          var viewYear = scope.viewYear;
          var viewMonth = scope.viewMonth;
          var nowDay = today.getDate();
          var isCurMonthNow = (viewYear === today.getFullYear() && viewMonth === today.getMonth());

          var lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();

          scope.dayList.zero();

          for (var i = 1; i <= lastDay; i++) {
            var isSelected;
            var isToday = false;
            var isViewMonth = true;

            var iDate = new Date(viewYear, viewMonth, i);
            if (isCurMonthNow && nowDay === i) {
              isToday = true;
            }
            isSelected = scope.selectedDates.findDate(viewYear, viewMonth, i).isPresent;
            scope.dayList.push({
              year: viewYear,
              month: viewMonth,
              date: i,
              day: iDate.getDay(),
              style: {isSelected: isSelected, isToday: isToday, isViewMonth: isViewMonth}
            });
          }

          // set Monday as the first day of the week.
          var insertDays = scope.dayList[0].day - scope.mondayFirst;
          insertDays = (insertDays < 0) ? 6 : insertDays;
          lastDay = new Date(viewYear, viewMonth, 0).getDate();

          // конец предыдущего месяца
          var date = monthShift(viewYear, viewMonth, '-');
          isViewMonth = false;
          isToday = false;


          for (var j = 0; j < insertDays; j++) {

            iDate = new Date(date.year, date.month, lastDay - j);
            isSelected = scope.selectedDates.findDate(date.year, date.month, lastDay - j).isPresent;
            scope.dayList.unshift({
              year: date.year,
              month: date.month,
              date: lastDay - j,
              day: iDate.getDay(),
              style: {isSelected: isSelected, isToday: isToday, isViewMonth: isViewMonth}
            });
          }

          scope.rows = [0, 7, 14, 21, 28];
          if (scope.dayList.length / 7 > 5) {
            scope.rows.push(35); // = [0, 7, 14, 21, 28, 35];
          }

          var daysLeft = 7 - scope.dayList.length % 7;
          // начало следующего месяца
          date = monthShift(scope.viewYear, scope.viewMonth, '+');
          for (i = 1; i <= daysLeft; i++) {
            iDate = new Date(date.year, date.month, i);
            isSelected = scope.selectedDates.findDate(date.year, date.month, i).isPresent;

            scope.dayList.push({
              year: date.year,
              month: date.month,
              date: i,
              day: iDate.getDay(),
              style: {isSelected: isSelected, isToday: isToday, isViewMonth: isViewMonth}
            });
          }

          scope.cols = [0, 1, 2, 3, 4, 5, 6];

          //scope.numColumns = 7;
        }

        scope.prevMonth = function () {
          var date = monthShift(scope.viewYear, scope.viewMonth, '-');
          scope.viewYear = date.year;
          scope.viewMonth = date.month;

          refreshDateList();
        };

        scope.nextMonth = function () {
          var date = monthShift(scope.viewYear, scope.viewMonth, '+');
          scope.viewYear = date.year;
          scope.viewMonth = date.month;

          refreshDateList();
        };

        // tap по клеточке с датой
        scope.dateSelected = function (date) {
          if (scope.accessType == ACCESS_TYPE.READ_WRITE) {
            scope.selectedDates.addRemove(date.year, date.month, date.date);
            scope.dayList.repaint();
            scope.selectedDates.checkPeriod();
            if (scope.closeOnSelect) {
              btnOk();
              if (scope.templateType === TEMPLATE_TYPE.POPUP) {
                $timeout(scope.popup.close, 300);
              } else {
                $timeout(scope.closeModal, 300);
              }
            }
          }
        };

        function monthShift(year, month, direction) {
          switch (direction) {
            case '+':
              if (month === 11) {
                year++;
                month = 0;
              } else {
                month++;
              }
              break;

            case '-':
              if (month === 0) {
                year--;
                month = 11;
              } else {
                month--;
              }
              break;
          }

          return {year: year, month: month};
        }

        function btnOk() {
          scope.inputObj.callback(scope.selectedDates);
        }

        function btnCancel() {
          scope.inputObj.callback(scope.inputDates);
        }

        function btnClear() {
          scope.selectedDates.clear();
          scope.dayList.repaint();
        }

        function btnToday() {
          var d = new Date();

          scope.viewYear = d.getFullYear();
          scope.viewMonth = d.getMonth();

          refreshDateList();
        }

        //Called when the user clicks on the button to invoke the 'ionic-datepicker'
        element.on("click", function () {
          //This code is added to set passed date from datepickerObject

          start();

          if (scope.templateType === TEMPLATE_TYPE.MODAL) {
            scope.openModal();
          } else {
            //Getting the reference for the 'ionic-datepicker' popup.
            var buttons = scope.btns;
            if (!scope.btnsIsNative) {
              buttons = [];
            }
            scope.popup = $ionicPopup.show({
              templateUrl: 'ionic-datepicker-popup.html',
              //title: scope.title,
              //subTitle: '',
              cssClass: 'picker-body',
              scope: scope,
              buttons: buttons
            });
          }
        });
      }
    };
  }

})();