var React = require('react');
var ReactDOM = require('react-dom');
var Rx = require('rx');
var LoginViewController = require('./view-controllers/login-view-controller.js');
var CreateAccountViewController = require('./view-controllers/create-account-view-controller.js');
var ForgotPasswordViewController = require('./view-controllers/forgot-password-view-controller.js');
var ResetPasswordViewController = require('./view-controllers/reset-password-view-controller.js');
var URL = require('url-parse');
var fireabse = require('./firebase-app');

var defaultTitle = document.title;

const RedirectViewController = (to) => {
    return () => {
        document.location = to;
    };
};

const SignOutViewController = () => {
    Rx.Observable.just('Sign out')
        .flatMap(() => Rx.Observable.fromPromise(firebase.auth().signOut()))
        .subscribe(() => { document.location = '#/'; });
};

const LoggedInViewController = ($container) => {
    ReactDOM.render(
        <div>
            <p>Logged in as <em>{ firebase.auth().currentUser.email }</em>!</p>
            <p><a href="#/sign-out/">Sign out</a></p>
        </div>,
        $container
    );
};



Rx.Observable.just('Routing')
    .flatMap(() => {
        // Initialization
        return Rx.Observable.create(function(observer) {
            firebase.auth().onAuthStateChanged(function(user) {
                observer.onNext(user);
                observer.onCompleted();
            });
        });
    })
    .flatMap(() => {
        return Rx.Observable.merge([
            Rx.Observable.just('initial load'),
            Rx.Observable.fromEvent(window, 'hashchange')
        ]);
    })
    .map(() => document.location.hash || '' )
    .map((hash) => {
        var url = new URL(hash.substr(1) || '/');
        if (fireabse.auth().currentUser) {
            // User has logged in
            switch(url.pathname) {
                case '/sign-out/':
                    return [SignOutViewController, 'Sign out'];
                case '/':
                    return [LoggedInViewController];
                default:
                    return [RedirectViewController('#/')];
            }
        } else {
            // User has NOT logged in
            switch(url.pathname) {
                case '/create-account/':
                    return [CreateAccountViewController, 'Create new account', 'login-bg'];
                case '/forgot-password/':
                    return [ForgotPasswordViewController, 'Forgot password', 'login-bg'];
                case '/reset-password/':
                    return [ResetPasswordViewController, 'Reset password', 'login-bg'];
                case '/':
                    return [LoginViewController, 'Login', 'login-bg'];
                default:
                    return [RedirectViewController('#/')];
            }
        }
    })
    .tapOnNext(([viewController]) => {
        // Render view
        viewController(document.getElementsByTagName('main')[0]);
    })
    .tapOnNext(([vc, title, customBodyClass]) => {
        document.title = title ? `${title} - ${defaultTitle}` : defaultTitle;
        
        document.body.removeAttribute('class');
        if (customBodyClass) {
            document.body.classList.add(customBodyClass);
        }
    })
    .subscribe();
