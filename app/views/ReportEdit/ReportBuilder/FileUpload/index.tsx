import React, { useCallback } from 'react';
import {
    useParams,
} from 'react-router-dom';
import { useAlert } from '@the-deep/deep-ui';
import { gql, useMutation } from '@apollo/client';
import { removeNull } from '@togglecorp/toggle-form';

import GalleryFileUpload from '#components/GalleryFileUpload';

import {
    CreateReportFileMutation,
    CreateReportFileMutationVariables,
    AnalysisReportUploadInputType,
    AnalysisReportUploadType,
    GalleryFileType,
} from '#generated/types';

const CREATE_REPORT_FILE = gql`
    mutation CreateReportFile(
        $projectId: ID!,
        $data: AnalysisReportUploadInputType!,
    ) {
        project(id: $projectId) {
            id
            analysisReportUploadCreate(
                data: $data,
            ) {
                ok
                errors
                result {
                    id
                    file {
                        id
                        title
                        mimeType
                        metadata
                        file {
                            url
                            name
                        }
                    }
                    metadata {
                        csv {
                            headerRow
                            variables {
                                completeness
                                name
                                type
                            }
                        }
                        geojson {
                            variables {
                                completeness
                                name
                                type
                            }
                        }
                        xlsx {
                            sheets {
                                headerRow
                                name
                                variables {
                                    completeness
                                    name
                                    type
                                }
                            }
                        }
                    }
                    report
                    type
                }
            }
        }
    }
`;
interface Props {
    onSuccess: (file: AnalysisReportUploadType) => void;
    acceptFileType?: '.pdf' | 'image/*';
    disabled?: boolean;
}

function AryFileUpload(props: Props) {
    const {
        onSuccess,
        acceptFileType,
        disabled,
    } = props;
    const alert = useAlert();

    const {
        reportId,
        projectId,
    } = useParams<{
        projectId: string | undefined,
        reportId: string | undefined,
    }>();

    const [
        uploadAttachment,
        {
            loading,
        },
    ] = useMutation<CreateReportFileMutation, CreateReportFileMutationVariables>(
        CREATE_REPORT_FILE,
        {
            onCompleted: (response) => {
                if (!response || !response.project?.analysisReportUploadCreate?.result) {
                    return;
                }

                const {
                    ok,
                    result,
                    errors,
                } = response.project.analysisReportUploadCreate;

                if (errors) {
                    alert.show(
                        'Failed to upload file.',
                        { variant: 'error' },
                    );
                } else if (ok) {
                    const resultRemoveNull = removeNull(result);
                    onSuccess(
                        resultRemoveNull,
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to upload file.',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleFileInputChange = useCallback(
        (value: NonNullable<GalleryFileType>) => {
            if (!value) {
                return;
            }

            if (!reportId || !projectId) {
                return;
            }
            uploadAttachment({
                variables: {
                    projectId,
                    data: {
                        file: value.id,
                        report: reportId,
                        type: 'IMAGE' as const,
                        metadata: {},
                    },
                },
                context: {
                    hasUpload: true,
                },
            });
        }, [
            reportId,
            uploadAttachment,
            projectId,
        ],
    );

    return (
        <GalleryFileUpload
            onSuccess={handleFileInputChange}
            projectIds={projectId ? [projectId] : undefined}
        />
    );
}

export default AryFileUpload;
