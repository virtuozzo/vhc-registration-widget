Vz.Widgets = Vz.Widgets || {};

Vz.Widgets.VHC = function (config) {
    var self = this;
    self.element = config.oElement;
    self.preKey = config.preKey || false;
    self.sKey = false;
    self.form = false;
    self.currentStep = 0;
    self.slider = false;
    self.baseUrl = self.element.getAttribute('data-base-url') || window.location.protocol + '//' + window.location.host + '/';
    self.PersonalInfoSent = false;
    self.defHoster = false;
    self.pardotTracking = self.element.getAttribute('data-tracking') ? JSON.parse(self.element.getAttribute('data-tracking').toLowerCase()) : true;
    self.availableDistis = {};
    self.testing = self.element.getAttribute('data-testing') ? true : false;

    self.render = function (options) {

        var name = '';
        if (self.preKey) {
            self.availableDistis = Vz.Widgets.Distributors.filter(oDisti => {
                return oDisti.preKey.toLowerCase() === self.preKey.toLowerCase()
            })
            if (self.availableDistis.length === 0) {
                $(self.element).removeClass('loading').addClass('loading-error');
                console.error('Data-Key is not valid');
                return false;
            }
            self.sKey = self.availableDistis[0].key;
        }

        sHtml = new EJS({url: self.baseUrl + 'vhc-signup/partial/widget'}).render({
            baseUrl: self.baseUrl,
            testing: self.testing
        });
        $(self.element).append(sHtml);

        self.form = $(self.element).find('form');

        self.form.find('#password').on('keyup', function () {
            var resp = Vz.utils.isPasswordValid($(self.form).find('[name=password]').val());
            if (resp.bar === 0) {
                $('.password-status').removeClass('show');
            } else {
                $('.password-status').addClass('show');
            }
            $(self.element).find('.password-status').css('color', resp.color);
            $(self.element).find('.pass-status-bar-progress').css('width', resp.bar + '%').css('background', resp.barcolor);
            $('.pass-status-label').text(resp.message);
        })

        self.form.find('#password-2').on('change', function () {
            if (self.form.find('#password').val() !== $(this).val()) {
                Vz.Widgets.Modal.show(self.form.find('#password-2'), {
                    msg: 'The passwords entered do not match',
                    position: 'bottom'
                });
            }
        });

        $(self.element).find('.vhc-next').click(self.checkStep);
        $(self.element).find('.vhc-prev').click(self.prevStep);
        $(self.element).find('[type="submit"]').click(self.submit);
        $(self.element).find('#country').change(self.changePhone);

        self.phone = $(self.element).find('#phone')[0];
        self.iti = window.intlTelInput(self.phone, {
            preferredCountries: ['US', 'GB'],
            countrySearch: false,
            initialCountry: "us",
            showSelectedDialCode: true,
            utilsScript: self.baseUrl + "vhc-signup/js/plugins/utils.js",
        });

        $(self.element).removeClass('loading');
    }

    self.changePhone = function () {
        self.iti.setCountry($(self.element).find('#country').val());
    }

    self.trackSalesForce = function (sURL, oParams) {
        $(self.element).addClass('loading');
        $.ajax({
            url: 'https://mprocessing.virtuozzo.com/vhc-signup/trackPardot.php',
            headers: {
                'X-vz-0VYe+zINV0qhfJw': 'X-Check'
            },
            type: "POST",
            data: {
                formHandler: sURL,
                oParams: oParams
            }
        }).done(function (response) {
            $(self.element).removeClass('loading');
            $response = JSON.parse(response);
            if ($response.code === 0) {
                self.PersonalInfoSent = true;
                self.switchStep('next');
            } else {
                self.form.find('[name=email]').focus();
                Vz.Widgets.Modal.show(self.form.find('[name=email]'), {
                    msg: 'Please enter a valid business email address',
                    position: 'bottom'
                });
            }
        });
    }

    self.submit = function (e) {
        e.preventDefault();

        var isValid = self.validStep();
        if (isValid) {
            $(self.element).addClass('loading');
            $.ajax({
                url: 'https://mprocessing.virtuozzo.com/vhc-signup/sign-up.php',
                headers: {
                    'X-vz-0VYe+zINV0qhfJw': 'X-Check'
                },
                type: "POST",
                dataType: 'json',
                data: $(self.form).serialize(),
            }).done(function (response) {
                if (response.result === 'error') {
                    if (response.message === 'A user already exists with that email address') {
                        self.markAsValid(2, false);
                        self.markAsValid(1, false);
                        self.markAsValid(0, false);
                        self.currentStep = 0;
                        $(self.element).find('.vhc-step.active').removeClass('active');
                        $(self.element).find('.vhc-step').eq(self.currentStep).addClass('active');

                        $(self.element).find('.vhc-singup-left ul li a.active').removeClass('active');
                        $(self.element).find('.vhc-singup-left ul li').eq(self.currentStep).find('a').addClass('active');

                        self.form.find('[name=email]').focus();
                        Vz.Widgets.Modal.show(self.form.find('[name=email]'), {
                            msg: response.message,
                            position: 'bottom'
                        });

                        if ($(window).width() <= 475) {
                            $([document.documentElement, document.body]).animate({
                                scrollTop: $(self.form).offset().top
                            }, 300);
                        }
                    }
                } else {
                    if (self.pardotTracking) {
                        self.trackSalesForce('https://go.virtuozzo.com/l/148051/2024-03-05/7gdygc', {
                            firstName: $(self.form).find('[name=firstName]').val(),
                            lastName: $(self.form).find('[name=lastName]').val(),
                            email: $(self.form).find('[name=email]').val(),
                            company: $(self.form).find('[name=company]').val(),
                            street: $(self.form).find('[name=street]').val(),
                            country: $(self.form).find('[name=country] option:selected').text(),
                            city: $(self.form).find('[name=city]').val(),
                            state: $(self.form).find('[name=state]').val(),
                            phone: $(self.form).find('[name=phone]').val(),
                            postcode: $(self.form).find('[name=postcode]').val(),
                            partnerId: self.slider.find('input:checked').attr('data-id'),
                            newsletter: self.form.find('#newsletter').is(':checked'),
                            terms: self.form.find('#terms').is(':checked'),
                            trial: self.form.find('#trial').is(':checked'),
                            data_disclosure_to_distributor: self.form.find('#data_disclosure_to_distributor').is(':checked'),
                        });
                    }
                    $(self.element).addClass('success');
                }

                $(self.element).removeClass('loading');

            });
        }
    }

    self.switchStep = function (step = 'next') {
        if (step === 'next') {
            self.markAsValid(self.currentStep, true);
            self.currentStep += 1;

            $(self.element).find('.vhc-step.active').removeClass('active');
            $(self.element).find('.vhc-step').eq(self.currentStep).addClass('active');

            $(self.element).find('.vhc-singup-left ul li a.active').removeClass('active');
            $(self.element).find('.vhc-singup-left ul li').eq(self.currentStep).find('a').addClass('active');
        } else {
            self.currentStep -= 1;
            if (self.currentStep < 0) {
                self.currentStep = 0;
            }
            self.markAsValid(self.currentStep, false);
            $(self.element).find('.vhc-step.active').removeClass('active');
            $(self.element).find('.vhc-step').eq(self.currentStep).addClass('active');

            $(self.element).find('.vhc-singup-left ul li a.active').removeClass('active');
            $(self.element).find('.vhc-singup-left ul li').eq(self.currentStep).find('a').addClass('active');
        }
        self.scrollToActive();
    }

    self.checkStep = function () {

        var isValid = self.validStep();
        if (isValid) {

            // Sending personal info to SF
            if (self.currentStep === 0) {
                if (self.PersonalInfoSent === false) {
                    self.trackSalesForce('https://go.virtuozzo.com/l/148051/2024-03-05/7gdy18', {
                        firstName: $(self.form).find('[name=firstName]').val(),
                        lastName: $(self.form).find('[name=lastName]').val(),
                        email: $(self.form).find('[name=email]').val(),
                        company: $(self.form).find('[name=company]').val(),
                        newsletter: self.form.find('#newsletter').is(':checked'),
                        terms: self.form.find('#terms').is(':checked'),
                        trial: self.form.find('#trial').is(':checked'),
                        registration_source: self.sKey || 'Virtuozzo'
                    });
                } else {
                    self.switchStep('next');
                }
                return;
            }

            if (self.currentStep === 1) {
                self.switchStep('next');
                initialslide = 0;
                // sort distis if default isn't setup
                if (!self.sKey) {
                    // remove inactive distis
                    self.availableDistis = Vz.Widgets.Distributors.filter(oDisti => {
                        return oDisti.active === true;
                    })

                    // check is available disti for chose region
                    var userCountry = $(self.form).find('[name=country]').val();
                    var userRegion = Vz.Widgets.countryContinentNEW[$(self.form).find('[name=country]').val()];
                    self.availableDistis = self.availableDistis.filter(oDisti => {
                        if (oDisti.regions.length) {
                            return oDisti.regions.includes(userRegion);
                        } else {
                            return true;
                        }
                    });

                    // check is available disti for chose country
                    self.availableDistis = self.availableDistis.filter(oDisti => {
                        if (oDisti.countries.length) {
                            return oDisti.countries.includes(userCountry);
                        } else {
                            return true;
                        }
                    });
                    // duplicating if available distis are not enough to creating slider
                    while (self.availableDistis.length > 1 && self.availableDistis.length <= 3) {
                        self.availableDistis = self.availableDistis.concat(self.availableDistis);
                    }
                }

                // render distis slider
                sHtml = new EJS({url: self.baseUrl + 'vhc-signup/partial/distis'}).render({
                    oDistributors: self.availableDistis
                });
                $(self.element).find('.vhc-step-3-inner').replaceWith(sHtml);
                self.slider = $(self.element).find('.distributors-slider');

                if (!self.sKey && (self.availableDistis.length > 1)) {
                    // find recommended disti by region
                    var continent = Vz.Widgets.countryContinentNEW[$(self.form).find('[name=country]').val()];
                    var result = self.availableDistis.filter(oDisti => {
                        return oDisti.isDefFor.includes(continent)
                    });
                    if (result.length && result[0].key) {
                        var defHoster = $(self.element).find('input[value="' + result[0].key + '"]').closest('.distributor');
                        var initialslide = self.slider.find('.distributor').index(defHoster[0]);
                    }
                    self.slider.on('init', function (event, slick) {
                        self.slider.find('[data-slick-index=' + initialslide + '] input').attr('checked', 'checked');
                    });

                    // init slider
                    self.slider.slick({
                        slidesToShow: 3,
                        centerMode: true,
                        centerPadding: 0,
                        initialSlide: parseInt(initialslide),
                        responsive: [
                            {
                                breakpoint: 475,
                                settings: {
                                    slidesToShow: 1,
                                    slidesToScroll: 1
                                }
                            }
                        ]
                    });
                    self.slider.on('afterChange', function (event, slick, currentSlide) {
                        self.slider.find('input').attr('checked', false);
                        self.slider.find('.distributor[data-slick-index=' + currentSlide + '] input').attr('checked', 'checked');
                    });
                    // self.slider.slick('setPosition');
                } else {
                    self.slider.addClass('with-key');
                    self.slider.find('input').attr('checked', 'checked');
                }
                return;
            }
        }
    }

    self.prevStep = function () {
        self.switchStep('prev');
    }

    self.scrollToActive = function () {
        if ($(window).width() <= 475) {
            $([document.documentElement, document.body]).animate({
                scrollTop: $(self.element).offset().top
            }, 300);
        }
    }

    self.markAsValid = function (step, isValid) {
        if (isValid) {
            $(self.element).find('.vhc-singup-left ul li').eq(step).find('a').addClass('valid');
        } else {
            $(self.element).find('.vhc-singup-left ul li').eq(step).find('a').removeClass('valid');
        }
    }

    self.validStep = function (args) {

        var isValid = true;

        switch (self.currentStep) {
            case 1:
                var passValid = Vz.utils.isPasswordValid($(self.form).find('[name=password]').val());
                if (passValid.bar === 0) {
                    isValid = false;
                    Vz.Widgets.Modal.show(self.form.find('#password'), {
                        msg: passValid.message,
                        position: 'bottom'
                    });
                    break;
                }
                if (self.form.find('#password').val() !== self.form.find('#password-2').val()) {
                    isValid = false;
                    Vz.Widgets.Modal.show(self.form.find('#password-2'), {
                        msg: 'The passwords entered do not match',
                        position: 'bottom'
                    });
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=street]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=country]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=city]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=state]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=phone]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=postcode]'), '')) {
                    isValid = false;
                    break;
                }
                break;

            case 2:
                if (!Vz.utils.isFieldValid($(self.form).find('[name=data_disclosure_to_distributor]'), 'checkbox')) {
                    isValid = false;
                    break;
                }
                break;

            default:
                if (!Vz.utils.isFieldValid($(self.form).find('[name=firstName]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=lastName]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=email]'), 'email')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=company]'), '')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=terms]'), 'checkbox')) {
                    isValid = false;
                    break;
                }
                if (!Vz.utils.isFieldValid($(self.form).find('[name=trial]'), 'checkbox')) {
                    isValid = false;
                    break;
                }
                break;
        }
        return !!isValid;
    }

    if (self.element) {
        if (self.testing) {
            self.pardotTracking = false;
        }
        self.render();
    } else {
        throw new Error('Oops! Something was wrong!');
    }
}

Vz.Widgets.Modal = (function (that) {

    that.show = function ($el, oOpt) {
        var nTimeoutId,
            sMsg = oOpt.msg,
            sPos = oOpt.position || 'right',
            nTimeOut = oOpt.hideTime || 5000,
            nWidth = oOpt.width || 220,
            fnHide,
            bAutoHide = oOpt.autoHide || true;

        if (sPos === 'auto') {
            sPos = ($(window).width() - $el.offset().left - $el.width() > nWidth) ? 'right' : 'bottom';
        }

        fnHide = function () {
            if (bAutoHide) {
                clearTimeout(nTimeoutId);
            }
            $el.popover('hide');
        };

        // $el.popover('destroy');

        $el.popover($.extend(oOpt, {
            placement: sPos,
            trigger: 'manual',
            animation: true,
            content: sMsg
        })).popover('show');

        if (bAutoHide) {
            nTimeoutId = setTimeout(function () {
                $el.popover('hide');
            }, nTimeOut);
        }

        $el.one("focus keypress change").focus(function () {
            fnHide();
        });
    };

    that.hoverShow = function (oEl, oOpt) {

        oEl.hover(function () {
            that.show(oEl, oOpt);
        }, function () {

            oEl.popover("hide");
        });

    };

    return that;
}(Vz.Widgets.Modal || {}));


jQuery(document).ready(function ($) {

    var $VHC = $('.vhc-signup-widget'),
        $oVHCwidgets = [];

    if ($VHC.length > 0) {

        Vz.utils.loadDistis(['https://www.virtuozzo.com/vhc-signup/distributors.js'], function () {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const distributor = urlParams.get('distributor');
            $.each($VHC, function (index) {
                this.classList.add('loading');
                var oAtts = {
                    oElement: this
                };
                if (this.getAttribute('data-key')) {
                    oAtts['preKey'] = this.getAttribute('data-key');
                }
                if (distributor) {
                    oAtts['preKey'] = distributor;
                }
                $oVHCwidgets[index] = new Vz.Widgets.VHC(oAtts);
            });
        });
    }
});