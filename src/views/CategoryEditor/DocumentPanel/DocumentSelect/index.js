import CSSModules from 'react-css-modules';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ListView from '../../../../vendor/react-store/components/View/List/ListView';
import ListItem from '../../../../vendor/react-store/components/View/List/ListItem';
import Button from '../../../../vendor/react-store/components/Action/Button';
import PrimaryButton from '../../../../vendor/react-store/components/Action/Button/PrimaryButton';
import DangerButton from '../../../../vendor/react-store/components/Action/Button/DangerButton';

import {
    categoryEditorDocumentsSelector,
    setCeFilesAction,
    ceIdFromRouteSelector,
    ceStringsSelector,
} from '../../../../redux';
import DeepGalleryFileSelect from '../../../../components/DeepGalleryFileSelect';
import { iconNames } from '../../../../constants';

import styles from '../../styles.scss';

const propTypes = {
    className: PropTypes.string,
    selectedFiles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.idRequired,
        title: PropTypes.string,
    })),
    setCeDeepGalleryFiles: PropTypes.func.isRequired,
    categoryEditorId: PropTypes.number.isRequired,
    ceStrings: PropTypes.func.isRequired,
};

const defaultProps = {
    className: '',
    selectedFiles: [],
};

const mapStateToProps = (state, props) => ({
    selectedFiles: categoryEditorDocumentsSelector(state, props),
    categoryEditorId: ceIdFromRouteSelector(state, props),
    ceStrings: ceStringsSelector(state),
});


const mapDispatchToProps = dispatch => ({
    setCeDeepGalleryFiles: params => dispatch(setCeFilesAction(params)),
});

@connect(mapStateToProps, mapDispatchToProps)
@CSSModules(styles, { allowMultiple: true })
export default class DocumentSelect extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        this.state = {
            selectedFiles: props.selectedFiles,
            pending: false,
            pristine: false,
            showGallerySelectModal: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            this.setState({
                selectedFiles: nextProps.selectedFiles,
                pending: false,
                pristine: false,
            });
        }
    }

    handleModalClose = (galleryFiles = []) => {
        const { selectedFiles } = this.state;
        const newSelectedFiles = galleryFiles.filter(file => (
            selectedFiles.findIndex(f => file.id === f.id) === -1
        ));

        if (newSelectedFiles.length) {
            this.setState({
                selectedFiles: selectedFiles.concat(newSelectedFiles),
                pristine: true,
            });
        }

        this.setState({
            showGallerySelectModal: false,
        });
    }

    handleRemoveFiles = (id) => {
        const { selectedFiles } = this.state;
        const index = selectedFiles.findIndex(file => file.id === id);
        if (index !== -1) {
            const newSelectedFiles = [...selectedFiles];
            newSelectedFiles.splice(index, 1);
            this.setState({
                selectedFiles: newSelectedFiles,
                pristine: true,
            });
        }
    }

    handleApply = () => {
        const { categoryEditorId } = this.props;
        const { selectedFiles } = this.state;
        this.props.setCeDeepGalleryFiles({
            files: selectedFiles,
            categoryEditorId,
        });
    }

    handleSelectFromGallery = () => {
        this.setState({ showGallerySelectModal: true });
    }

    keyExtractorForGalleryFiles = file => file.id

    renderGalleryFilesListItem = (fileId, file) => (
        <ListItem
            className={styles['file-list-item']}
            key={fileId}
        >
            <span className={styles.title} >
                {file.title}
            </span>
            <DangerButton
                className={styles.icon}
                onClick={() => this.handleRemoveFiles(fileId)}
                transparent
            >
                <span className={iconNames.delete} />
            </DangerButton>
        </ListItem>
    );

    render() {
        const {
            className,
        } = this.props;

        const {
            pending,
            pristine,
            selectedFiles,
            showGallerySelectModal,
        } = this.state;

        return (
            <div
                styleName="document-tab"
                className={className}
            >
                <ListView
                    styleName="file-list-view"
                    modifier={this.renderGalleryFilesListItem}
                    data={selectedFiles}
                    keyExtractor={this.keyExtractorForGalleryFiles}
                />
                <div styleName="bottom-bar">
                    <Button
                        styleName="button"
                        onClick={this.handleSelectFromGallery}
                    >
                        {this.props.ceStrings('selectFromGalleryButtonLabel')}
                    </Button>
                    <PrimaryButton
                        styleName="button"
                        onClick={this.handleApply}
                        disabled={pending || !pristine}
                    >
                        {this.props.ceStrings('applyButtonLabel')}
                    </PrimaryButton>
                </div>
                <DeepGalleryFileSelect
                    show={showGallerySelectModal}
                    onClose={this.handleModalClose}
                />
            </div>
        );
    }
}