import {
    RequestContext,
    useRequest as useMyRequest,
    RequestOptions,
    useLazyRequest as useMyLazyRequest,
    LazyRequestOptions,
    ContextInterface,
} from '@togglecorp/toggle-request';
import { AlertOptions } from '@the-deep/deep-ui';
import { mapToMap, isDefined, randomString } from '@togglecorp/fujs';
import {
    serverlessEndpoint,
    pdfCacheEndpoint,
    wsEndpoint,
    // reactAppApiHttps,
} from '#base/configs/restRequest';
import { deepEnvironment } from '#base/configs/env';

const CONTENT_TYPE_JSON = 'application/json';
// const CONTENT_TYPE_STREAM = 'application/octet-stream';

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        const part = parts.pop();
        return part && part.split(';').shift();
    }
    return undefined;
}

function getVersionedUrl(endpoint: string, url: string) {
    const versionString = '/v2';
    if (!url.startsWith(versionString)) {
        return `${endpoint}${url}`;
    }

    const oldVersionString = '/v1';
    const startIndex = 0;
    const endIndex = endpoint.search(oldVersionString);
    const newEndpoint = endpoint.slice(startIndex, endIndex);
    return `${newEndpoint}${url}`;
}

type Literal = string | number | boolean | File;

type FormDataCompatibleObj = Record<string, Literal | Literal[] | null | undefined>;

function getFormData(jsonData: FormDataCompatibleObj) {
    const formData = new FormData();
    Object.keys(jsonData || {}).forEach(
        (key) => {
            const value = jsonData?.[key];
            if (value && Array.isArray(value)) {
                value.forEach((v) => {
                    formData.append(key, v instanceof Blob ? v : String(v));
                });
            } else if (isDefined(value)) {
                formData.append(key, value instanceof Blob ? value : String(value));
            } else {
                formData.append(key, '');
            }
        },
    );
    return formData;
}

export interface Error {
    reason: string;
    // exception: any;
    value: {
        // FIXME: deprecate faramErrors as it doesn''t work with new form
        faramErrors: {
            [key: string]: string | undefined;
        },
        errors: ErrorFromServer['errors'] | undefined,
        messageForNotification: string,
    };
    errorCode: number | undefined;
}

export interface ErrorFromServer {
    errorCode?: number;
    errors: {
        // NOTE: it is most probably only string[]
        [key: string]: string[] | string;
    };
}

function alterResponse(errors: ErrorFromServer['errors']): Error['value']['faramErrors'] {
    const otherErrors = mapToMap(
        errors,
        (item) => (item === 'nonFieldErrors' ? '$internal' : item),
        (item) => (Array.isArray(item) ? item.join(' ') : item),
    );
    return otherErrors;
}

export interface OptionBase {
    isFile?: boolean;
    formData?: boolean;
    failureMessage?: React.ReactNode;
}

export type DeepContextInterface = ContextInterface<
    object,
    ErrorFromServer | undefined,
    Error,
    OptionBase
>;

const serverPrefix = 'server://';
const serverlessPrefix = 'serverless://';
const pdfCachePrefix = 'pdf-cache://';
export const processDeepUrls: DeepContextInterface['transformUrl'] = (url) => {
    if (url.startsWith(serverPrefix)) {
        // NOTE: -1 to leave out the starting slash
        const cleanedUrl = url.slice(serverPrefix.length - 1);
        return getVersionedUrl(wsEndpoint, cleanedUrl);
    }
    if (url.startsWith(serverlessPrefix)) {
        // NOTE: -1 to leave out the starting slash
        const cleanedUrl = url.slice(serverlessPrefix.length - 1);
        return `${serverlessEndpoint}${cleanedUrl}`;
    }
    if (url.startsWith(pdfCachePrefix)) {
        // NOTE: -1 to leave out the starting slash
        const cleanedUrl = url.slice(pdfCachePrefix.length - 1);
        return `${pdfCacheEndpoint}${cleanedUrl}`;
    }
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    // eslint-disable-next-line no-console
    console.error('Url should start with http/https or a defined scope', url);
    return url;
};

export const processDeepOptions: DeepContextInterface['transformOptions'] = (
    url,
    options,
    requestOptions,
) => {
    const {
        body,
        headers,
        ...otherOptions
    } = options;

    let finalOptions: RequestInit & {
        headers: {
            'X-CSRFToken'?: string;
        },
    };
    if (requestOptions.formData) {
        const requestBody = getFormData(body as FormDataCompatibleObj);
        finalOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                ...headers,
            },
            body: requestBody,
            ...otherOptions,
        };
    } else if (requestOptions.isFile) {
        finalOptions = {
            method: 'GET',
            headers: {
                // FIXME: Better define this for security reasons?
                Accept: '*/*',
                'Content-Type': 'application/octet-stream',
                ...headers,
            },
            body: undefined,
            ...otherOptions,
        };
    } else {
        const requestBody = body ? JSON.stringify(body) : undefined;
        finalOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
                ...headers,
            },
            body: requestBody,
            ...otherOptions,
        };
    }

    const isInternalRequest = url.startsWith(serverPrefix);
    if (isInternalRequest) {
        /*
        // TODO: enable this after the feature is enabled in server
        const csrftoken = reactAppApiHttps === 'https'
            ? getCookie(`__Secure-deep-${deepEnvironment}-csrftoken`)
            : getCookie(`deep-${deepEnvironment}-csrftoken`);
       */
        const csrftoken = getCookie(`deep-${deepEnvironment}-csrftoken`);

        finalOptions.credentials = 'include';
        if (finalOptions.headers) {
            finalOptions.headers['X-CSRFToken'] = csrftoken;
        }
    }

    return finalOptions;
};

export const processDeepResponse: DeepContextInterface['transformResponse'] = async (
    res,
    /*
    url,
    options,
    ctx,
    */
) => {
    if (res.status >= 200 && res.status < 300) {
        if (res.headers.get('content-type') === CONTENT_TYPE_JSON) {
            const resText = await res.text();

            if (resText.length > 0 && res.headers.get('content-type') === CONTENT_TYPE_JSON) {
                const json = JSON.parse(resText);
                return json;
            }
            return undefined;
        }

        const arrayBuffer = await res.arrayBuffer();
        return arrayBuffer;
    }

    return undefined;
};

export const processDeepError = (
    addAlert: (alert: AlertOptions) => void,
): DeepContextInterface['transformError'] => (
    res,
    _,
    __,
    ctx,
) => {
    let error: Error;
    if (res === 'network') {
        error = {
            reason: 'network',
            // exception: e,
            value: {
                messageForNotification: 'Network error',
                faramErrors: {
                    $internal: 'Network error',
                },
                errors: undefined,
            },
            errorCode: undefined,
        };
    } else if (res === 'parse') {
        error = {
            reason: 'parse',
            value: {
                messageForNotification: 'Response parse error',
                faramErrors: {
                    $internal: 'Response parse error',
                },
                errors: undefined,
            },
            errorCode: undefined,
        };
    } else if (res) {
        const faramErrors = alterResponse(res.errors);

        const messageForNotification = (
            faramErrors?.$internal
            ?? 'Some error occurred while performing this action.'
        );

        const requestError = {
            faramErrors,
            messageForNotification,
            errors: res.errors,
        };

        error = {
            reason: 'server',
            value: requestError,
            errorCode: res.errorCode,
        };
    } else {
        const requestError = {
            messageForNotification: 'Server error',
            faramErrors: {
                $internal: 'Server error',
            },
            errors: undefined,
        };

        error = {
            reason: 'server',
            value: requestError,
            errorCode: undefined,
        };
    }

    const { failureMessage } = ctx;

    if (failureMessage) {
        // NOTE: failureMessage is not used
        addAlert({
            children: error.value.messageForNotification,
            variant: 'error',
            duration: 3000,
            name: randomString(),
        });
        // eslint-disable-next-line no-console
        console.error(
            failureMessage,
            error.value.messageForNotification,
        );
    }

    return error;
};

// eslint-disable-next-line max-len
const useLazyRequest: <R, C = null>(requestOptions: LazyRequestOptions<R, Error, C, OptionBase>) => {
    response: R | undefined;
    pending: boolean;
    error: Error | undefined;
    trigger: (ctx: C) => void;
    context: C | undefined,
} = useMyLazyRequest;

const useRequest: <R>(requestOptions: RequestOptions<R, Error, OptionBase>) => {
    response: R | undefined;
    pending: boolean;
    error: Error | undefined;
    retrigger: () => void;
} = useMyRequest;

export { RequestContext, useRequest, useLazyRequest };
