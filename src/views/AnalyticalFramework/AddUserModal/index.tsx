import React, { useMemo, useCallback } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    ObjectSchema,
    PartialForm,
    requiredCondition,
    useForm,
} from '@togglecorp/toggle-form';
import {
    Modal,
    SelectInput,
    Button,
} from '@the-deep/deep-ui';

import LoadingAnimation from '#rscv/LoadingAnimation';
import NonFieldError from '#components/ui/NonFieldError';
import { useRequest, useLazyRequest } from '#utils/request';
import { notifyOnFailure } from '#utils/requestNotify';
import { MultiResponse } from '#typings';
import _ts from '#ts';

import styles from './styles.scss';

interface UserToEdit {
    id: number;
    member: number;
    memberName: string;
    role: number;
}

interface Role {
    id: number;
    title: string;
}

interface User {
    id: number;
    displayName: string;
}

const membersKeySelector = (d: User) => d.id;
const membersLabelSelector = (d: User) => d.displayName;

const roleKeySelector = (d: Role) => d.id;
const roleLabelSelector = (d: Role) => d.title;

type FormType = {
    id?: number;
    member?: number;
    role: number;
};

type FormSchema = ObjectSchema<PartialForm<FormType>>;
type FormSchemaFields = ReturnType<FormSchema['fields']>

const schema: FormSchema = {
    fields: (value): FormSchemaFields => {
        if (isDefined(value.id)) {
            return ({
                role: [requiredCondition],
            });
        }
        return ({
            member: [requiredCondition],
            role: [requiredCondition],
        });
    },
};

const defaultFormValue: PartialForm<FormType> = {};

interface ValueToSend {
    role: number;
    member?: number;
    framework: number;
}

interface Props {
    onModalClose: () => void;
    frameworkId: number;
    onTableReload: () => void;
    isPrivateFramework: boolean;
    userValue?: UserToEdit;
}

function AddUserModal(props: Props) {
    const {
        onModalClose,
        frameworkId,
        onTableReload,
        userValue,
        isPrivateFramework,
    } = props;

    const formValueFromProps: PartialForm<FormType> = userValue ?? defaultFormValue;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(formValueFromProps, schema);

    const queryForUsers = useMemo(() => ({
        members_exclude_framework: frameworkId,
    }), [frameworkId]);

    const queryForRoles = useMemo(
        () => (isPrivateFramework ? ({ is_default_role: false }) : undefined),
        [isPrivateFramework],
    );

    const {
        pending: pendingRoles,
        response: frameworkRolesResponse,
    } = useRequest<MultiResponse<Role>>({
        url: isPrivateFramework
            ? 'server://private-framework-roles/'
            : 'server://public-framework-roles/',
        method: 'GET',
        query: queryForRoles,
        onFailure: (_, errorBody) => {
            notifyOnFailure(_ts('analyticalFramework.addUser', 'roleFetchFailed'))({ error: errorBody });
        },
    });

    const {
        pending: pendingUserList,
        response: usersListResponse,
    } = useRequest<MultiResponse<User>>({
        url: 'server://users/',
        method: 'GET',
        query: queryForUsers,
        onFailure: (_, errorBody) => {
            notifyOnFailure(_ts('analyticalFramework.addUser', 'usersFetchFailed'))({ error: errorBody });
        },
    });

    const {
        pending: pendingAddAction,
        trigger: triggerAddFrameworkMember,
    } = useLazyRequest<unknown, ValueToSend>({
        url: isDefined(userValue)
            ? `server://framework-memberships/${userValue.id}/`
            : 'server://framework-memberships/',
        method: isDefined(userValue)
            ? 'PATCH'
            : 'POST',
        body: ctx => ctx,
        onSuccess: () => {
            onTableReload();
            onModalClose();
        },
        onFailure: (_, errorBody) => {
            notifyOnFailure(_ts('analyticalFramework.addUser', 'membershipPostFailed'))({ error: errorBody });
        },
    });

    const handleSubmit = useCallback(
        () => {
            const { errored, error: err, value: val } = validate();
            onErrorSet(err);
            if (!errored && isDefined(val)) {
                triggerAddFrameworkMember({ ...val, framework: frameworkId } as ValueToSend);
            }
        },
        [onErrorSet, validate, triggerAddFrameworkMember, frameworkId],
    );

    const usersList = useMemo(() => {
        if (isNotDefined(userValue)) {
            return usersListResponse?.results ?? [];
        }
        return [
            ...(usersListResponse?.results ?? []),
            {
                id: userValue.member,
                displayName: userValue.memberName,
            },
        ];
    }, [usersListResponse, userValue]);

    const pendingRequests = pendingRoles || pendingUserList;

    return (
        <Modal
            className={styles.modal}
            heading={
                isDefined(userValue)
                    ? _ts('analyticalFramework.addUser', 'editUserHeading')
                    : _ts('analyticalFramework.addUser', 'addUserHeading')
            }
            onCloseButtonClick={onModalClose}
            bodyClassName={styles.modalBody}
            footerActions={(
                <Button
                    name="submit"
                    variant="primary"
                    type="submit"
                    disabled={pristine || pendingRequests || pendingAddAction}
                    onClick={handleSubmit}
                >
                    {_ts('analyticalFramework.addUser', 'submitLabel')}
                </Button>
            )}
        >
            {pendingAddAction && (<LoadingAnimation />)}
            <NonFieldError error={error} />
            <SelectInput
                name="member"
                readOnly={isDefined(userValue)}
                className={styles.input}
                options={usersList}
                keySelector={membersKeySelector}
                labelSelector={membersLabelSelector}
                optionsPopupClassName={styles.optionsPopup}
                onChange={onValueChange}
                value={value.member}
                label={_ts('analyticalFramework.addUser', 'userLabel')}
                placeholder={_ts('analyticalFramework.addUser', 'selectUserPlaceholder')}
                error={error?.fields?.member}
                disabled={pendingRequests}
            />
            <SelectInput
                name="role"
                className={styles.input}
                options={frameworkRolesResponse?.results}
                keySelector={roleKeySelector}
                labelSelector={roleLabelSelector}
                optionsPopupClassName={styles.optionsPopup}
                onChange={onValueChange}
                value={value.role}
                label={_ts('analyticalFramework.addUser', 'roleLabel')}
                placeholder={_ts('analyticalFramework.addUser', 'selectRolePlaceholder')}
                error={error?.fields?.role}
                disabled={pendingRequests}
            />
        </Modal>
    );
}

export default AddUserModal;
