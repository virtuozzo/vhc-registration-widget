Vz = window.Vz || {};
$ = $ || jQuery;

Vz.Widgets =(function (that) {


}(Vz.Widgets || {}));

Vz.utils = (function (that) {

    that.loadDistis = function (scripts, callback) {

        var count = scripts.length;

        function urlCallback(url) {
            return function () {
                --count;
                if (count < 1) {
                    callback();
                }
            };
        }

        function loadScript(url) {
            var s = document.createElement('script');
            s.setAttribute('src', url);
            s.onload = urlCallback(url);
            document.head.appendChild(s);
        }

        for (var script of scripts) {
            loadScript(script);
        }
    }

    that.isValidEmail = function (email) {
        var pattern = /.@./;
        return pattern.test(email);
    };

    that.isFieldValid = function (field, type) {
        var isValid = true;

        if (type === 'email') {
            if (!Vz.utils.isValidEmailStrong(field.val())) {
                isValid = false;
                Vz.Widgets.Modal.show(field, {
                    msg: 'The e-mail value is not valid',
                    position: 'bottom'
                });

                return isValid;
            }
        }

        if (type === 'checkbox') {
            if (field.is(':checked') === false) {
                isValid = false;
                Vz.Widgets.Modal.show(field.parent().find('span'), {
                    msg: 'This field is required',
                    position: 'bottom'
                });

                return isValid;
            }
        }

        if (field.val().trim().length < 2) {
            isValid = false;
            Vz.Widgets.Modal.show(field, {
                msg: 'This field is required',
                position: 'bottom'
            });
        }

        return isValid;
    }

    that.isPasswordValid = function (password) {
        var resp = {};
        var strength = 0;
        if (password.match(/[a-z]+/)) {
            strength += 1;
        }
        if (password.match(/[A-Z]+/)) {
            strength += 1;
        }
        if (password.match(/[0-9]+/)) {
            strength += 1;
        }
        if (password.match(/[$@#&!]+/)) {
            strength += 1;
        }
        if (password.length < 5) {
            strength = 0;
        }

        switch (strength) {
            case 0:
                resp.bar = 0;
                resp.message = 'at least 5 characters';
                resp.color = 'rgb(197, 147, 1)';
                resp.barcolor = '#ffaa00';
                break;

            case 1:
                resp.bar = 50;
                resp.message = 'Moderate';
                resp.color = 'rgb(197, 147, 1)';
                resp.barcolor = '#ffaa00';
                break;

            case 2:
                resp.bar = 65;
                resp.message = 'Strong';
                resp.color = 'rgb(25, 136, 16)';
                resp.barcolor = '#36C055';
                break;

            case 3:
                resp.bar = 85;
                resp.message = 'Strong';
                resp.color = 'rgb(25, 136, 16)';
                resp.barcolor = '#36C055';
                break;

            case 4:
                resp.bar = 100;
                resp.message = 'Strong';
                resp.color = 'rgb(25, 136, 16)';
                break;
        }

        return resp;
    };

    that.isValidEmailStrong = function (email) {
        var pattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/i;
        return pattern.test(email);
    };

    return that;
}(Vz.utils || {}));