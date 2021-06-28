import React from 'react';
import {
    ScaleInput,
} from '@the-deep/deep-ui';

import { ScaleValue, ScaleWidget, PartialForm } from '../../types';
import WidgetWrapper from '../../Widget';

export type PartialScaleWidget = PartialForm<
    ScaleWidget,
    'clientId' | 'type'
>;

type Option = NonNullable<NonNullable<
    NonNullable<PartialScaleWidget>['data']
>['options']>[number];

const optionKeySelector = (option: Option) => option.clientId;
const optionLabelSelector = (option: Option) => option.label ?? 'Unnamed';
const optionColorSelector = (option: Option) => option.color ?? '#414141';

export interface Props<N extends string>{
    title: string | undefined;
    className?: string;

    name: N,
    value: ScaleValue | null | undefined,
    onChange: (value: ScaleValue | undefined, name: N) => void,

    actions?: React.ReactNode,
    disabled?: boolean;
    readOnly?: boolean;

    widget: PartialScaleWidget,
}

function ScaleWidgetInput<N extends string>(props: Props<N>) {
    const {
        className,
        title,
        name,
        value,
        onChange,
        actions,
        widget,
        disabled,
        readOnly,
    } = props;

    return (
        <WidgetWrapper
            className={className}
            title={title}
            actions={actions}
        >
            <ScaleInput
                name={name}
                options={widget?.data?.options}
                keySelector={optionKeySelector}
                labelSelector={optionLabelSelector}
                colorSelector={optionColorSelector}
                onChange={onChange}
                value={value ?? widget?.data?.defaultValue}
                readOnly={readOnly}
                disabled={disabled}
            />
        </WidgetWrapper>
    );
}

export default ScaleWidgetInput;