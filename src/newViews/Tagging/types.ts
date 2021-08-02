import {
    TextValue,
    NumberValue,
    TimeValue,
    DateValue,
    TimeRangeValue,
    DateRangeValue,
    SingleSelectValue,
    MultiSelectValue,
    ScaleValue,
    OrganigramValue,
    GeoLocationValue,
    Matrix1dValue,
    Matrix2dValue,
    Types,
} from '../AnalyticalFramework/types';

interface BaseWidgetValue {
    id: string;
    type: Types;
}

interface BaseValue<T> {
    value: T;
}

export interface TextWidgetValue extends BaseWidgetValue {
    type: 'text';
    data: BaseValue<TextValue>;
}

export interface NumberWidgetValue extends BaseWidgetValue {
    type: 'number';
    data: BaseValue<NumberValue>;
}

export interface TimeWidgetValue extends BaseWidgetValue {
    type: 'time';
    data: BaseValue<TimeValue>;
}

export interface DateWidgetValue extends BaseWidgetValue {
    type: 'date';
    data: BaseValue<DateValue>;
}

export interface TimeRangeWidgetValue extends BaseWidgetValue {
    type: 'time-range';
    data: BaseValue<TimeRangeValue>;
}

export interface DateRangeWidgetValue extends BaseWidgetValue {
    type: 'date-range';
    data: BaseValue<DateRangeValue>;
}

export interface SingleSelectWidgetValue extends BaseWidgetValue {
    type: 'single-select';
    data: BaseValue<SingleSelectValue>;
}

export interface MultiSelectWidgetValue extends BaseWidgetValue {
    type: 'multi-select';
    data: BaseValue<MultiSelectValue>;
}

export interface ScaleWidgetValue extends BaseWidgetValue {
    type: 'scale';
    data: BaseValue<ScaleValue>;
}

export interface OrganigramWidgetValue extends BaseWidgetValue {
    type: 'organigram';
    data: BaseValue<OrganigramValue>;
}

export interface GeoLocationWidgetValue extends BaseWidgetValue {
    type: 'geo-location';
    data: BaseValue<GeoLocationValue>;
}

export interface Matrix1dWidgetValue extends BaseWidgetValue {
    type: 'matrix-1d';
    data: BaseValue<Matrix1dValue>;
}

export interface Matrix2dWidgetValue extends BaseWidgetValue {
    type: 'matrix-2d';
    data: BaseValue<Matrix2dValue>;
}

export type WidgetValue = TextWidgetValue
    | NumberWidgetValue
    | TimeWidgetValue
    | DateWidgetValue
    | TimeRangeWidgetValue
    | DateRangeWidgetValue
    | SingleSelectWidgetValue
    | MultiSelectWidgetValue
    | ScaleWidgetValue
    | OrganigramWidgetValue
    | GeoLocationWidgetValue
    | Matrix1dWidgetValue
    | Matrix2dWidgetValue

export type EntryType = 'excerpt' | 'image' | 'dataSeries';

export interface Entity {
    id: number;
    createdAt: string;
    createdBy: number;
    createdByName: string;
    modifiedBy: number;
    modifiedByName: string;
    clientId: string;
    versionId: number;
}

export interface TabularDataFields {
    cache: {
        healthStatus: {
            empty: number;
            total: number;
            invalid: number;
        };
        imageStatus: string;
        images: {
            id: number;
            format: string;
            chartType: string;
        }[];
        status: string;
        series: {
            value: string | number;
            count: number;
        };
    };
}

export interface UserFields {
    id: number;
    displayName: string;
    email: string;
}

export interface Entry extends Entity {
    project: number;
    lead: number;
    entryType: EntryType;

    analyticalFramework: number;
    attributes: WidgetValue[];

    verified: boolean;
    verificationLastChangedByDetails?: UserFields;

    excerpt?: string;
    droppedExcerpt?: string;

    // Labels for entry groups
    projectLabels?: string[];

    // Data for image type entry
    image?: number;
    imageRaw?: string;
    imageDetails?: {
        id: number;
        file: string;
    };

    // Data for dataSeries type entry
    tabularField?: number;
    tabularFieldData?: TabularDataFields;
}
