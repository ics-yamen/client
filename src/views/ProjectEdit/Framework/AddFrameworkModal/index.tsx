import React, { useCallback } from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    Modal,
    TextInput,
    TextArea,
    Button,
    PendingMessage,
} from '@the-deep/deep-ui';
import {
    ObjectSchema,
    PartialForm,
    requiredCondition,
    useForm,
} from '@togglecorp/toggle-form';

import { useLazyRequest } from '#utils/request';
import { notifyOnFailure } from '#utils/requestNotify';
import notify from '#notify';
import _ts from '#ts';

import styles from './styles.scss';

type FormType = {
    title: string;
    description?: string;
};

interface Framework {
    id: number;
}

type FormSchema = ObjectSchema<PartialForm<FormType>>;
type FormSchemaFields = ReturnType<FormSchema['fields']>

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        title: [requiredCondition],
        description: [],
    }),
};

const defaultFormValue: PartialForm<FormType> = {};

interface ValueToSend {
    title: string;
    description?: string;
}

interface Props {
    className?: string;
    frameworkToClone?: FormType;
    onActionSuccess: (newFrameworkId: number) => void;
    onModalClose: () => void;
}

function addCloneLabel(details: FormType | undefined) {
    if (!details) {
        return undefined;
    }

    return ({
        title: `${details.title} (cloned)`,
        description: details.description,
    });
}

function AddFrameworkModal(props: Props) {
    const {
        className,
        frameworkToClone,
        onActionSuccess,
        onModalClose,
    } = props;

    const formValueFromProps: PartialForm<FormType> =
        addCloneLabel(frameworkToClone) ?? defaultFormValue;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(formValueFromProps, schema);

    const {
        pending: pendingAddAction,
        trigger: triggerCreateFramework,
    } = useLazyRequest<Framework, ValueToSend>({
        url: 'server://analysis-frameworks/',
        method: 'POST',
        body: ctx => ctx,
        onSuccess: (response) => {
            onActionSuccess(response?.id);
            notify.send({
                title: _ts('projectEdit', 'analyticalFramework'),
                type: notify.type.WARNING,
                message: isDefined(frameworkToClone)
                    ? _ts('projectEdit', 'cloneFrameworkSuccessMessage')
                    : _ts('projectEdit', 'createFrameworkSuccessMessage'),
                duration: notify.duration.MEDIUM,
            });
        },
        onFailure: (_, errorBody) => {
            notifyOnFailure(_ts('projectEdit', 'projectMembershipPostFailed'))({ error: errorBody });
        },
    });

    const handleSubmit = useCallback(
        () => {
            const { errored, error: err, value: val } = validate();
            onErrorSet(err);
            if (!errored && isDefined(val)) {
                triggerCreateFramework(val as ValueToSend);
            }
        },
        [onErrorSet, validate, triggerCreateFramework],
    );

    const pendingRequests = pendingAddAction;

    return (
        <Modal
            className={_cs(className, styles.modal)}
            heading={
                isDefined(frameworkToClone)
                    ? _ts('projectEdit', 'cloneFrameworkHeading')
                    : _ts('projectEdit', 'addFrameworkHeading')
            }
            onCloseButtonClick={onModalClose}
            bodyClassName={styles.modalBody}
            footerActions={(
                <Button
                    name="submit"
                    variant="primary"
                    type="submit"
                    disabled={pristine || pendingAddAction}
                    onClick={handleSubmit}
                >
                    {_ts('projectEdit', 'submitLabel')}
                </Button>
            )}
        >
            {pendingRequests && <PendingMessage />}
            <TextInput
                name="title"
                className={styles.input}
                onChange={onValueChange}
                value={value.title}
                label={_ts('projectEdit', 'titleLabel')}
                placeholder={_ts('projectEdit', 'titlePlaceholder')}
                error={error?.fields?.title}
                disabled={pendingRequests}
            />
            <TextArea
                name="description"
                rows={5}
                className={styles.input}
                onChange={onValueChange}
                value={value.description}
                label={_ts('projectEdit', 'descriptionLabel')}
                placeholder={_ts('projectEdit', 'descriptionPlaceholder')}
                error={error?.fields?.description}
                disabled={pendingRequests}
            />
        </Modal>
    );
}

export default AddFrameworkModal;
