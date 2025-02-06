Vz.Widgets = Vz.Widgets || {};

Vz.Widgets.VHCD = function (config) {
    var self = this;
    self.element = config.oElement;
    self.form = false;
    self.currentStep = 0;
    self.baseUrl = self.element.getAttribute('data-base-url') || window.location.protocol + '//' + window.location.host + '/';
    self.PersonalInfoSent = false;
    self.pardotTracking = self.element.getAttribute('data-tracking') ? JSON.parse(self.element.getAttribute('data-tracking').toLowerCase()) : true;
    self.sDefCountries = {
        "EU": "CH",
        "APAC": "SG",
        "NAMER": "US",
        "LATAM": "BR",
        "MEA": "AE"
    }
    self.sDefCountry = 'US';
    self.testing = self.element.getAttribute('data-testing') ? true : false;

    self.signupErrors = {
        UNKNOWN: "Something went wrong. We suspect this was caused by network issues, so please try again in a few minutes. If your second attempt fails, please, email us at <a href='mailto:support.portal.issues@virtuozzo.com'>support.portal.issues@virtuozzo.com</a> to get the assistance with account creation.",
        EMAIL_EXISTS: "A user already exists with that email address",
        ERROR_EMAIL: "The specified email address is not allowed for registration. Please use another email or contact us at <a href='mailto:support.portal.issues@virtuozzo.com'>support.portal.issues@virtuozzo.com</a> for the assistance.",
        EMAIL_DENY: "The specified email address is not allowed for registration.<br>Please use another email or contact us at <a href='mailto:support.portal.issues@virtuozzo.com'>support.portal.issues@virtuozzo.com</a> for the assistance."
    };
    self.render = function (options) {

        var name = '';
        self.availableCountries = Vz.Widgets.countries;
        console.log(self.availableCountries)
        sHtml = new EJS({url: self.baseUrl + 'vhc-direct-signup/partial/widget'}).render({
            baseUrl: self.baseUrl,
            testing: self.testing,
            oCountries: {
                keys: Object.keys(self.availableCountries),
                values: Object.values(self.availableCountries)
            },
            sDefCountry: self.sDefCountry
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
            initialCountry: self.sDefCountry.toLowerCase(),
            showSelectedDialCode: true,
            utilsScript: self.baseUrl + "vhc-signup/js/plugins/utils.js",
        });

        $(self.element).removeClass('loading');
    }

    self.changePhone = function () {
        self.iti.setCountry($(self.element).find('#country').val());
    }

    self.trackSalesForce = function (sURL, oParams) {
        if (self.pardotTracking) {
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
        } else {
            self.switchStep('next');
        }
    }

    self.submit = function (e) {
        e.preventDefault();

        var isValid = self.validStep();
        if (isValid) {
            $(self.element).addClass('loading');

            // MAXMIND
            $.ajax({
                url: 'https://mprocessing.virtuozzo.com/maxmind.php',
                headers: {
                    'X-vz-0VYe+zINV0qhfJw': 'X-Check'
                },
                type: "POST",
                dataType: 'json',
                data: $(self.form).serialize(),
            }).done(function (response) {
                console.log(response)
                if (response.result === 'error') {
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
                        msg: self.signupErrors.EMAIL_DENY,
                        position: 'bottom',
                    });

                    if ($(window).width() <= 475) {
                        $([document.documentElement, document.body]).animate({
                            scrollTop: $(self.form).offset().top
                        }, 300);
                    }
                    $(self.element).removeClass('loading');

                } else {
                    // VHC registration
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
                            if (response.code === 10001) {
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
                                    msg: self.signupErrors.EMAIL_EXISTS,
                                    position: 'bottom',
                                });

                                if ($(window).width() <= 475) {
                                    $([document.documentElement, document.body]).animate({
                                        scrollTop: $(self.form).offset().top
                                    }, 300);
                                }
                            }
                            if (response.code === 10002) {
                                self.markAsValid(2, false);
                                self.markAsValid(1, false);
                                self.currentStep = 1;
                                $(self.element).find('.vhc-step.active').removeClass('active');
                                $(self.element).find('.vhc-step').eq(self.currentStep).addClass('active');
                                $(self.element).find('.vhc-singup-left ul li a.active').removeClass('active');
                                $(self.element).find('.vhc-singup-left ul li').eq(self.currentStep).find('a').addClass('active');
                                self.form.find('[name=phone]').focus();

                                Vz.Widgets.Modal.show(self.form.find('[name=phone]'), {
                                    msg: 'You did not enter your phone number',
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
                                self.trackSalesForce('https://go.virtuozzo.com/l/148051/2025-01-28/7pfgt4', {
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
                                    partnerId: '001UY0000086trdYAA', // Virtuozzo Direct ID
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
            if (self.PersonalInfoSent === false) {
                self.trackSalesForce('https://go.virtuozzo.com/l/148051/2025-01-28/7pfgtx', {
                    firstName: $(self.form).find('[name=firstName]').val(),
                    lastName: $(self.form).find('[name=lastName]').val(),
                    email: $(self.form).find('[name=email]').val(),
                    company: $(self.form).find('[name=company]').val(),
                    newsletter: self.form.find('#newsletter').is(':checked'),
                    terms: self.form.find('#terms').is(':checked'),
                    trial: self.form.find('#trial').is(':checked'),
                    registration_source: 'Virtuozzo',
                    referrer: window.location.href
                });
            } else {
                self.switchStep('next');
            }
            return;
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

        $el.popover('destroy');

        $el.popover($.extend(oOpt, {
            html: true,
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

    var $VHCD = $('.vhc-direct-signup-widget'),
        $oVHCDwidgets = [];

    if ($VHCD.length > 0) {
        $.each($VHCD, function (index) {
            this.classList.add('loading');
            var oAtts = {
                oElement: this
            };
            $oVHCDwidgets[index] = new Vz.Widgets.VHCD(oAtts);
        });
    }
});