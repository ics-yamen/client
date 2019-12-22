/**
 * @author frozenhelium <fren.ankit@gmail.com>
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { reverseRoute } from '@togglecorp/fujs';
import Faram, {
    requiredCondition,
    emailCondition,
    lengthGreaterThanCondition,
} from '@togglecorp/faram';
import { parseUrlParams } from '@togglecorp/react-rest-request';

import { FgRestBuilder } from '#rsu/rest';

import Icon from '#rscg/Icon';
import PrimaryButton from '#rsca/Button/PrimaryButton';
import NonFieldErrors from '#rsci/NonFieldErrors';
import ReCaptcha from '#rsci/ReCaptcha';
import TextInput from '#rsci/TextInput';

import { hidUrl } from '#config/hid';
import { reCaptchaSiteKey } from '#config/reCaptcha';
import { pathNames } from '#constants';
import {
    alterResponseErrorToFaramError,
    createParamsForTokenCreate,
    urlForTokenCreate,
    createParamsForTokenCreateHid,
    urlForTokenCreateHid,
} from '#rest';
import {
    loginAction,
    authenticateAction,
} from '#redux';
import { startSiloBackgroundTasksAction } from '#redux/middlewares/siloBackgroundTasks';
import schema from '#schema';
import _ts from '#ts';

import styles from './styles.scss';

const propTypes = {
    authenticate: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    login: PropTypes.func.isRequired,
    startSiloTasks: PropTypes.func.isRequired,
};

const defaultProps = {
};

const mapDispatchToProps = dispatch => ({
    authenticate: () => dispatch(authenticateAction()),
    login: params => dispatch(loginAction(params)),
    startSiloTasks: params => dispatch(startSiloBackgroundTasksAction(params)),
});

@connect(undefined, mapDispatchToProps)
export default class Login extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static schema = {
        fields: {
            email: [
                requiredCondition,
                emailCondition,
            ],
            password: [
                requiredCondition,
                lengthGreaterThanCondition(4),
            ],
        },
    };

    static schemaWithRecaptcha = {
        fields: {
            email: [
                requiredCondition,
                emailCondition,
            ],
            password: [
                requiredCondition,
                lengthGreaterThanCondition(4),
            ],
            recaptchaResponse: [requiredCondition],
        },
    };

    constructor(props) {
        super(props);

        this.state = {
            faramErrors: {},
            faramValues: {},
            pending: false,
            showReCaptcha: false,
            schema: Login.schema,
        };
    }

    componentWillMount() {
        this.checkParamsFromHid();
    }

    componentWillUnmount() {
        if (this.userLoginRequest) {
            this.userLoginRequest.stop();
        }
    }

    // HID

    onHidLoginClick = () => {
        // Just set it to pending
        // The anchor will redirect user to next page
        this.setState({ pending: true });
    }

    setResetRecaptchaFunction = (func) => {
        this.resetRecaptcha = func;
    }

    checkParamsFromHid = () => {
        // FIXME: get location value from redux
        const { location } = this.props;
        // Get params from the current url
        // NOTE: hid provides query as hash
        const query = parseUrlParams(location.hash.replace('#', ''));
        // Login User with HID access_token
        if (query.access_token) {
            const params = createParamsForTokenCreateHid({
                accessToken: query.access_token,
                expiresIn: query.expires_in,
                state: query.state,
                tokenType: query.token_type,
            });
            this.login({ url: urlForTokenCreateHid, params });
        }
    }

    handleFaramChange = (faramValues, faramErrors) => {
        this.setState({
            faramValues,
            faramErrors,
        });
    };

    handleFaramValidationFailure = (faramErrors) => {
        this.setState({ faramErrors });
    };

    handleFaramValidationSuccess = (_, { email, password, recaptchaResponse }) => {
        const url = urlForTokenCreate;
        const params = createParamsForTokenCreate({
            username: email,
            password,
            recaptchaResponse,
        });
        this.login({ url, params });
    };

    // LOGIN ACTION

    login = ({ url, params }) => {
        // Stop any retry action
        if (this.userLoginRequest) {
            this.userLoginRequest.stop();
        }

        this.userLoginRequest = this.createRequestLogin(url, params);
        this.userLoginRequest.start();
    };

    // LOGIN REST API

    createRequestLogin = (url, params) => {
        const userLoginRequest = new FgRestBuilder()
            .url(url)
            .params(params)
            .preLoad(() => {
                this.setState({ pending: true });
            })
            .postLoad(() => {
                if (this.resetRecaptcha) {
                    this.resetRecaptcha();
                }
            })
            .success((response) => {
                try {
                    schema.validate(response, 'tokenGetResponse');

                    const { refresh, access } = response;
                    this.props.login({ refresh, access });
                    this.props.startSiloTasks(() => console.log('Silo tasks started'));
                    this.props.authenticate();
                } catch (err) {
                    console.error(err);
                }
            })
            .failure((response) => {
                const faramErrors = alterResponseErrorToFaramError(response.errors);
                if (response.errorCode === 4004) {
                    const { showReCaptcha } = this.state;
                    this.setState({
                        faramErrors: {
                            ...faramErrors,
                            $internal: [
                                showReCaptcha ? _ts('login', 'retryRecaptcha') : _ts('login', 'enterRecaptcha'),
                            ],
                        },
                        pending: false,
                        showReCaptcha: true,
                        schema: Login.schemaWithRecaptcha,
                    });
                } else {
                    this.setState({
                        faramErrors,
                        pending: false,
                    });
                }
            })
            .fatal(() => {
                this.setState({
                    faramErrors: { $internal: [_ts('login', 'loginError')] },
                    pending: false,
                });
            })
            .build();
        return userLoginRequest;
    }

    render() {
        const {
            faramErrors,
            faramValues,
            pending,
            showReCaptcha,
        } = this.state;

        return (
            <div className={styles.login}>
                <div className={styles.deepContainer}>
                    <Icon
                        className={styles.logo}
                        name="deepLogo"
                    />
                    <h2 className={styles.heading}>
                        <small>{_ts('login', 'welcomeToText')}</small><br />
                    </h2>
                </div>
                <div className={styles.loginFormContainer}>
                    <div className={styles.hidLinkContainer}>
                        <a
                            className={styles.hidLink}
                            href={hidUrl}
                            onClick={this.onHidLoginClick}
                        >
                            <Icon
                                className={styles.logo}
                                name="hidLogo"
                                alt={_ts('login', 'logInWIthHid')}
                                draggable="false"
                            />
                            <span>
                                {_ts('login', 'logInWIthHid')}
                            </span>
                        </a>
                        <div className={styles.orContainer}>
                            <hr />
                            <span className={styles.or}>
                                {_ts('login', 'orText')}
                            </span>
                        </div>
                    </div>
                    <Faram
                        className={styles.loginForm}
                        onChange={this.handleFaramChange}
                        onValidationFailure={this.handleFaramValidationFailure}
                        onValidationSuccess={this.handleFaramValidationSuccess}
                        schema={this.state.schema}
                        value={faramValues}
                        error={faramErrors}
                        disabled={pending}
                    >
                        <NonFieldErrors faramElement />
                        <TextInput
                            faramElementName="email"
                            label={_ts('login', 'emailLabel')}
                            placeholder={_ts('login', 'emailPlaceholder')}
                            autoFocus
                        />
                        <TextInput
                            faramElementName="password"
                            label={_ts('login', 'passwordLabel')}
                            placeholder={_ts('login', 'passwordPlaceholder')}
                            type="password"
                        />
                        { showReCaptcha &&
                            <ReCaptcha
                                setResetFunction={this.setResetRecaptchaFunction}
                                faramElementName="recaptchaResponse"
                                siteKey={reCaptchaSiteKey}
                            />
                        }
                        <div className={styles.actionButtons}>
                            <Link
                                className={styles.forgotPasswordLink}
                                to={reverseRoute(pathNames.passwordReset, {})}
                            >
                                {_ts('login', 'forgotPasswordText')}
                            </Link>
                            <PrimaryButton
                                type="submit"
                                pending={pending}
                            >
                                {_ts('login', 'loginLabel')}
                            </PrimaryButton>
                        </div>
                    </Faram>
                    <div className={styles.registerLinkContainer}>
                        <p>
                            {_ts('login', 'noAccountYetText')}
                        </p>
                        <Link
                            className={styles.registerLink}
                            to={reverseRoute(pathNames.register, {})}
                        >
                            {_ts('login', 'registerLabel')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}
