/// <reference types="vite/client" />
interface OpenFileOption {
    title ?: string,
    defaultPath ?: string,
    buttonLabel ?: string,
    filters ?: { name: string, extensions: string[] }[],
    properties ?: Array < 'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent' >,
    message ?: string,
    securityScopedBookmarks ?: boolean
}

interface Window {
    preload: {
        /**
         * 打开一个文件，并返回blob对象
         * @param options 参数
         * @return 返回文件列表
         */
        openFile(options: OpenFileOption): Promise<Array<File>>
    }
}
