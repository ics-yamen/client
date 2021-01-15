import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

import Faram, {
    emailCondition,
    requiredCondition,
} from '@togglecorp/faram';
import { reverseRoute } from '@togglecorp/fujs';

import PrimaryButton from '#rsca/Button/PrimaryButton';
import NonFieldErrors from '#rsci/NonFieldErrors';
import ReCaptcha from '#rsci/ReCaptcha';
import TextInput from '#rsci/TextInput';

import { reCaptchaSiteKey } from '#config/reCaptcha';
import useRequest from '#utils/request';
import { pathNames } from '#constants';
import _ts from '#ts';

import styles from './styles.scss';

const faramSchema = {
    fields: {
        firstname: [requiredCondition],
        lastname: [requiredCondition],
        organization: [requiredCondition],
        email: [
            requiredCondition,
            emailCondition,
        ],
        recaptchaResponse: [requiredCondition],
    },
};

function Register() {
    const [faramValues, setFaramValues] = useState({});
    const [faramErrors, setFaramErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [userData, setUserData] = useState(undefined);

    const recaptchaRef = useRef(null);

    const [registerPending, , , triggerRegister] = useRequest({
        url: 'server://users/',
        method: 'POST',
        body: userData,
        onSuccess: () => {
            setSuccess(true);
            if (recaptchaRef.current && recaptchaRef.current.reset) {
                recaptchaRef.current.reset();
            }
        },
        onFailure: (_, { errorCode, faramErrors: newFaramErrors }) => {
            if (recaptchaRef.current && recaptchaRef.current.reset) {
                recaptchaRef.current.reset();
            }
            if (errorCode === 4004) {
                setFaramErrors({
                    ...newFaramErrors,
                    $internal: [
                        _ts('register', 'retryRecaptcha'),
                    ],
                });
            } else {
                setFaramErrors({
                    ...newFaramErrors,
                    email: newFaramErrors.username,
                });
            }
        },
        schemaName: 'userCreateResponse',
    });

    const handleFaramChange = useCallback((newFaramValues, newFaramErrors) => {
        setFaramValues(newFaramValues);
        setFaramErrors(newFaramErrors);
    }, []);

    const handleFaramValidationFailure = useCallback((newFaramErrors) => {
        setFaramErrors(newFaramErrors);
    }, []);

    const handleFaramValidationSuccess = useCallback((finalValues) => {
        setUserData({
            ...finalValues,
            // NOTE: username of the user is their email address
            username: finalValues.email,
        });
        triggerRegister();
    }, [triggerRegister]);

    return (
        <div className={styles.register}>
            <div className={styles.registerBox}>
                { success ? (
                    <div className={styles.registerSuccess}>
                        {_ts('register', 'checkYourEmailText', { email: userData?.email })}
                    </div>
                ) : (
                    <Faram
                        className={styles.registerForm}
                        onChange={handleFaramChange}
                        onValidationFailure={handleFaramValidationFailure}
                        onValidationSuccess={handleFaramValidationSuccess}
                        schema={faramSchema}
                        value={faramValues}
                        error={faramErrors}
                        disabled={registerPending}
                    >
                        <NonFieldErrors faramElement />
                        <TextInput
                            faramElementName="firstname"
                            label={_ts('register', 'firstNameLabel')}
                            placeholder={_ts('register', 'firstNamePlaceholder')}
                            autoFocus
                        />
                        <TextInput
                            faramElementName="lastname"
                            label={_ts('register', 'lastNameLabel')}
                            placeholder={_ts('register', 'lastNamePlaceholder')}
                        />
                        <TextInput
                            faramElementName="organization"
                            label={_ts('register', 'organizationLabel')}
                            placeholder={_ts('register', 'organizationPlaceholder')}
                        />
                        <TextInput
                            faramElementName="email"
                            label={_ts('register', 'emailLabel')}
                            placeholder={_ts('register', 'emailPlaceholder')}
                        />
                        <ReCaptcha
                            componentRef={recaptchaRef}
                            faramElementName="recaptchaResponse"
                            siteKey={reCaptchaSiteKey}
                        />
                        <div className={styles.actionButtons}>
                            <PrimaryButton
                                type="submit"
                                pending={registerPending}
                            >
                                { _ts('register', 'registerLabel')}
                            </PrimaryButton>
                        </div>
                    </Faram>
                )}
                <div className={styles.loginLinkContainer}>
                    <p>
                        { success ?
                            _ts('register', 'goBackToLoginText') :
                            _ts('register', 'alreadyHaveAccountText')
                        }
                    </p>
                    <Link
                        to={reverseRoute(pathNames.login, {})}
                        className={styles.loginLink}
                    >
                        {_ts('register', 'loginLabel')}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
