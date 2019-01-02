<template>
    <table>
        <thead>
            <tr>
                <th
                    v-for="(field) in fields"
                    :key="field.key"
                    :class="field.cssClass">{{ field.label }}</th>
            </tr>
        </thead>
        <tbody role="rowgroup">
            <tr
                v-for="(item, index) in items"
                :key="index"
                :aria-rowindex="index + 1"
                role="row">
                <td
                    v-for="(field, index) in fields"
                    :key="field.key"
                    :data-label="field.label"
                    :class="field.cssClass"
                    :aria-colindex="index + 1"
                    role="cell">
                    <slot
                        :name="field.key"
                        :item="item"
                        :index="index">{{ item[field.key] }}</slot>
                </td>
            </tr>
        </tbody>
    </table>
</template>
<script>
export default {
    props: {
        fields: {
            type: Array,
            default: () => {
                return {}
            }
        },
        items: {
            type: Array,
            default: () => {
                return []
            }
        }
    }
}
</script>
