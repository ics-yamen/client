import React, { useCallback, useState, useMemo } from 'react';
import {
    _cs,
    caseInsensitiveSubmatch,
    isTruthyString,
} from '@togglecorp/fujs';

import {
    TextInput,
    Container,
    List,
} from '@the-deep/deep-ui';
import _ts from '#ts';
import { IoSearch } from 'react-icons/io5';

import FileItem from './FileItem';
import { FileUploadResponse } from '../types';
import styles from './styles.scss';

const keySelector = (d: FileUploadResponse): number => d.id;

interface Props {
    className?: string;
    onDeleteFile: (id: number) => void;
    files: FileUploadResponse[];
}

function FilesUploaded(props: Props) {
    const {
        className,
        onDeleteFile,
        files = [],
    } = props;

    const fileRendererParams = useCallback((
        _: number,
        data: FileUploadResponse,
    ) => ({
        data,
        onDeleteFile,
    }), [onDeleteFile]);

    const [searchText, setSearchText] = useState<string | undefined>();

    const searchedFiles = useMemo(() => {
        if (isTruthyString(searchText)) {
            return files.filter(file => (
                caseInsensitiveSubmatch(file.title, searchText)
            ));
        }
        return files;
    }, [files, searchText]);

    return (
        <div
            className={_cs(className, styles.filesUploadedDetails)}
        >
            <Container
                className={styles.filesContainer}
                heading={_ts('bulkUpload', 'sourcesUploadedTitle')}
                contentClassName={styles.files}
                sub
            >
                <TextInput
                    className={styles.search}
                    icons={<IoSearch className={styles.icon} />}
                    name="Search"
                    onChange={setSearchText}
                    value={searchText}
                    placeholder="Search"
                    autoFocus
                />
                <div className={styles.list}>
                    <List
                        data={searchedFiles}
                        renderer={FileItem}
                        keySelector={keySelector}
                        rendererParams={fileRendererParams}
                    />
                </div>
            </Container>
        </div>
    );
}

export default FilesUploaded;
